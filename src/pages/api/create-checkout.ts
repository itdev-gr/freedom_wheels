import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { computeBookingTotal, fetchPricingData } from '../../lib/pricing';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const POST: APIRoute = async ({ request, url }) => {
	const secretKey = import.meta.env.STRIPE_SECRET_KEY;
	if (!secretKey) return json({ error: 'Stripe not configured' }, 503);

	const stripe = new Stripe(secretKey);

	try {
		const body = (await request.json()) as {
			customerName?: string;
			email?: string;
			phone?: string;
			scooterId?: string;
			scooterTitle?: string;
			pickupDate?: string;
			returnDate?: string;
			pickupLocationId?: string;
			returnLocationId?: string;
			totalEur?: number;
			totalDays?: number;
			notes?: string;
			/** Language path segment: 'en' or 'el' for success/cancel URLs */
			lang?: string;
		};

		// Recompute the total server-side from the catalog prices and location fees —
		// the client-sent totalEur is display-only and must not decide the charge.
		const { prices, locations } = await fetchPricingData();
		const computed = computeBookingTotal({
			scooterId: String(body.scooterId ?? '').trim(),
			pickupDate: String(body.pickupDate ?? '').trim(),
			returnDate: String(body.returnDate ?? '').trim(),
			pickupLocationId: String(body.pickupLocationId ?? '').trim(),
			returnLocationId: String(body.returnLocationId ?? '').trim(),
			prices,
			locations,
		});
		if (!computed || computed.totalEur <= 0) return json({ error: 'Invalid total amount' }, 400);

		const totalEur = computed.totalEur;
		const totalDays = computed.totalDays;
		const clientTotal = Number(body.totalEur) || 0;
		if (Math.abs(totalEur - clientTotal) > 0.01) {
			console.warn(`Checkout total mismatch: client sent €${clientTotal}, server computed €${totalEur}`);
		}

		const scooterTitle = String(body.scooterTitle ?? 'Scooter Rental').trim();

		const origin = url.origin;
		const lang = body.lang === 'el' ? 'el' : 'en';
		const checkoutPath = `/${lang}/checkout`;

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: [
				{
					price_data: {
						currency: 'eur',
						product_data: {
							name: `${scooterTitle} – ${totalDays} day${totalDays > 1 ? 's' : ''} rental`,
							description: `Pick-up: ${body.pickupDate ?? ''} | Return: ${body.returnDate ?? ''}`,
						},
						unit_amount: Math.round(totalEur * 100),
					},
					quantity: 1,
				},
			],
			metadata: {
				customerName: String(body.customerName ?? '').trim(),
				email: String(body.email ?? '').trim(),
				phone: String(body.phone ?? '').trim(),
				scooterId: String(body.scooterId ?? '').trim(),
				pickupDate: String(body.pickupDate ?? '').trim(),
				returnDate: String(body.returnDate ?? '').trim(),
				pickupLocationId: String(body.pickupLocationId ?? '').trim(),
				returnLocationId: String(body.returnLocationId ?? '').trim(),
				totalDays: String(totalDays),
				notes: String(body.notes ?? '').trim(),
			},
			customer_email: body.email ? String(body.email).trim() : undefined,
			success_url: `${origin}${checkoutPath}?success=1&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}${checkoutPath}`,
		});

		return json({ url: session.url });
	} catch (e) {
		console.error('Stripe error:', e);
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ error: 'Failed to create checkout session: ' + message }, 500);
	}
};
