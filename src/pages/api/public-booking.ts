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

		const doc = {
			customerName,
			email,
			phone,
			scooterId: String(body.scooterId ?? '').trim(),
			pickupDate: String(body.pickupDate ?? '').trim(),
			returnDate: String(body.returnDate ?? '').trim(),
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			totalEur: Number(body.totalEur) || 0,
			status: String(body.status ?? 'Pending').trim(),
			notes: String(body.notes ?? '').trim(),
			paymentMethod: String(body.paymentMethod ?? 'delivery').trim(),
			createdAt: new Date().toISOString(),
		};

		const ref = await db.collection('bookings').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create booking' }, 500);
	}
};
