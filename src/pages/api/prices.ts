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

function docId(scooterId: string, season: string, days: number) {
	return `${scooterId}_${season}_${days}`;
}

export const GET: APIRoute = async ({ request }) => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	const url = new URL(request.url);
	const scooter = url.searchParams.get('scooter');
	const season = url.searchParams.get('season');
	const daysParam = url.searchParams.get('days');
	try {
		const snap = await db.collection('prices').get();
		let prices = snap.docs.map((d) => {
			const data = d.data();
			return {
				scooter_id: data.scooterId,
				season: data.season,
				days: data.days,
				price_eur: data.priceEur,
			};
		});
		if (scooter) prices = prices.filter((p) => p.scooter_id === scooter);
		if (season) prices = prices.filter((p) => p.season === season);
		if (daysParam) prices = prices.filter((p) => p.days === parseInt(daysParam, 10));
		return json(prices);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch prices' }, 500);
	}
};

export const PUT: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = await request.json();
		const items = Array.isArray(body) ? body : [body];
		for (const item of items) {
			const scooterId = String(item.scooter_id ?? item.scooterId ?? '').trim();
			const season = String(item.season ?? '').trim();
			const days = Number(item.days);
			const priceEur = Number(item.price_eur ?? item.priceEur);
			if (!scooterId || !season || days < 1 || days > 7) continue;
			const id = docId(scooterId, season, days);
			await db.collection('prices').doc(id).set({ scooterId, season, days, priceEur }, { merge: true });
		}
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update prices' }, 500);
	}
};
