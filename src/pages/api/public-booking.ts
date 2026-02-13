import type { APIRoute } from 'astro';
import { getDb } from '../../lib/firebase';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const POST: APIRoute = async ({ request }) => {
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
			paymentMethod?: string;
		};

		const customerName = String(body.customerName ?? '').trim();
		const email = String(body.email ?? '').trim();
		const phone = String(body.phone ?? '').trim();

		if (!customerName) return json({ error: 'Full name is required' }, 400);
		if (!email && !phone) return json({ error: 'Email or phone is required' }, 400);

		const scooterId = String(body.scooterId ?? '').trim();
		const pickupDate = String(body.pickupDate ?? '').trim();
		const returnDate = String(body.returnDate ?? '').trim();

		const doc = {
			customerName,
			email,
			phone,
			scooterId,
			pickupDate,
			returnDate,
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			totalEur: Number(body.totalEur) || 0,
			status: String(body.status ?? 'Pending').trim(),
			notes: String(body.notes ?? '').trim(),
			paymentMethod: String(body.paymentMethod ?? 'delivery').trim(),
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
