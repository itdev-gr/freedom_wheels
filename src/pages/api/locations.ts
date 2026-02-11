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

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('locations').orderBy('sortOrder').get();
		const locations = snap.docs.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				slug: data.slug,
				label: data.label,
				sort_order: data.sortOrder,
				price_eur: data.priceEur != null ? data.priceEur : null,
			};
		});
		return json(locations);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch locations' }, 500);
	}
};

export const PUT: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as
			| { id?: string; slug?: string; label?: string; sort_order?: number; price_eur?: number }
			| { items?: Array<{ id?: string; slug?: string; label?: string; sort_order?: number; price_eur?: number }> };
		const items = Array.isArray((body as { items?: unknown }).items)
			? (body as { items: Array<{ id?: string; slug?: string; label?: string; sort_order?: number; price_eur?: number }> }).items
			: [body as { id?: string; slug?: string; label?: string; sort_order?: number; price_eur?: number }];
		for (const item of items) {
			const id = String(item.id ?? item.slug ?? '').trim();
			if (!id) continue;
			const ref = db.collection('locations').doc(id);
			const update: Record<string, unknown> = {};
			if (item.slug !== undefined) update.slug = String(item.slug).trim();
			if (item.label !== undefined) update.label = String(item.label).trim();
			if (item.sort_order !== undefined) update.sortOrder = Number(item.sort_order);
			if (item.price_eur !== undefined) update.priceEur = item.price_eur === null || item.price_eur === '' ? null : Number(item.price_eur);
			if (Object.keys(update).length > 0) await ref.set(update, { merge: true });
		}
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update locations' }, 500);
	}
};
