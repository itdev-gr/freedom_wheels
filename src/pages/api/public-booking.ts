import type { APIRoute } from 'astro';
import { computeBookingTotal, fetchPricingData } from '../../lib/pricing';
import { getScooters } from '../../lib/store';
import { submitRecord, countActiveBookings } from '../../lib/supabase';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const POST: APIRoute = async ({ request }) => {
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

		// Recompute the total server-side; keep the client value only as a fallback
		// so a booking that was already paid is never dropped.
		let totalEur = Number(body.totalEur) || 0;
		try {
			const { prices, locations } = await fetchPricingData();
			const computed = computeBookingTotal({
				scooterId,
				pickupDate,
				returnDate,
				pickupLocationId: String(body.pickupLocationId ?? '').trim(),
				returnLocationId: String(body.returnLocationId ?? '').trim(),
				prices,
				locations,
			});
			if (computed) totalEur = computed.totalEur;
		} catch (e) {
			console.error('Failed to recompute booking total, storing client value:', e);
		}

		const doc = {
			customerName,
			email,
			phone,
			scooterId,
			pickupDate,
			returnDate,
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			totalEur,
			status: String(body.status ?? 'pending').trim().toLowerCase(),
			notes: String(body.notes ?? '').trim(),
			paymentMethod: String(body.paymentMethod ?? 'delivery').trim(),
			createdAt: new Date().toISOString(),
		};

		// Inventory check: overlapping non-cancelled bookings must be < scooter quantity.
		// Stock count comes from the cached catalog; the overlap count is computed
		// live by the backend RPC so availability is always accurate.
		const scooters = await getScooters();
		const quantity = scooters.find((s) => s.id === scooterId)?.quantity ?? 0;
		const overlappingCount = await countActiveBookings(scooterId, pickupDate, returnDate);
		if (overlappingCount >= quantity) {
			return json(
				{ error: 'No availability for this scooter on the selected dates. Try different dates or another scooter.' },
				409
			);
		}

		const id = await submitRecord('bookings', doc);
		return json({ ok: true, id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create booking' }, 500);
	}
};
