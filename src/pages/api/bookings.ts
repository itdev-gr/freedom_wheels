import type { APIRoute } from 'astro';
import { getDb } from '../../lib/firebase';
import { verifySession } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const GET: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('bookings').get();
		const bookings = snap.docs
			.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				customerName: data.customerName,
				email: data.email,
				phone: data.phone,
				scooterId: data.scooterId,
				pickupDate: data.pickupDate,
				returnDate: data.returnDate,
				pickupLocationId: data.pickupLocationId,
				returnLocationId: data.returnLocationId,
				totalEur: data.totalEur,
				status: data.status,
				notes: data.notes,
				createdAt: data.createdAt,
			};
		})
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		return json(bookings);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch bookings' }, 500);
	}
};

export const POST: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as {
			customerName?: string;
			email?: string;
			phone?: string;
			scooterId?: string;
			pickupDate?: string;
			returnDate?: string;
			pickupLocationId?: string;
			returnLocationId?: string;
			totalEur?: number;
			status?: string;
			notes?: string;
		};
		const scooterId = String(body.scooterId ?? '').trim();
		const pickupDate = String(body.pickupDate ?? '').trim();
		const returnDate = String(body.returnDate ?? '').trim();
		const doc = {
			customerName: String(body.customerName ?? '').trim(),
			email: String(body.email ?? '').trim(),
			phone: String(body.phone ?? '').trim(),
			scooterId,
			pickupDate,
			returnDate,
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			totalEur: Number(body.totalEur) || 0,
			status: String(body.status ?? 'pending').trim(),
			notes: String(body.notes ?? '').trim(),
			createdAt: new Date().toISOString(),
		};

		// Inventory check: overlapping non-cancelled bookings must be < scooter quantity
		const scootersSnap = await db.collection('scooters').doc(scooterId).get();
		const quantity = scootersSnap.exists ? Number((scootersSnap.data() as { quantity?: number }).quantity) || 0 : 0;
		const bookingsSnap = await db.collection('bookings').where('scooterId', '==', scooterId).get();
		let overlappingCount = 0;
		for (const d of bookingsSnap.docs) {
			const data = d.data();
			const statusLower = String(data.status ?? '').toLowerCase();
			if (statusLower === 'cancelled' || statusLower === 'canceled') continue;
			const exPickup = String(data.pickupDate ?? '');
			const exReturn = String(data.returnDate ?? '');
			if (exPickup < returnDate && exReturn > pickupDate) overlappingCount++;
		}
		if (overlappingCount >= quantity) {
			return json(
				{ error: 'No availability for this scooter on the selected dates. Try different dates or another scooter.' },
				409
			);
		}

		const ref = await db.collection('bookings').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create booking' }, 500);
	}
};
