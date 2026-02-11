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
		const doc = {
			customerName: String(body.customerName ?? '').trim(),
			email: String(body.email ?? '').trim(),
			phone: String(body.phone ?? '').trim(),
			scooterId: String(body.scooterId ?? '').trim(),
			pickupDate: String(body.pickupDate ?? '').trim(),
			returnDate: String(body.returnDate ?? '').trim(),
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			totalEur: Number(body.totalEur) || 0,
			status: String(body.status ?? 'pending').trim(),
			notes: String(body.notes ?? '').trim(),
			createdAt: new Date().toISOString(),
		};
		const ref = await db.collection('bookings').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create booking' }, 500);
	}
};
