import type { APIRoute } from 'astro';
import { getDb } from '../../lib/firebase';
import { isAdminAuthenticated } from '../../lib/auth';

export const prerender = false;

const SEED_LOCATIONS = [
	{ slug: 'chania-store', label: 'Chania – Freedom Wheels (7 Apokoronou Str)', sortOrder: 0 },
	{ slug: 'chania-port', label: 'Chania – Port', sortOrder: 1 },
	{ slug: 'chania-airport', label: 'Chania – Airport', sortOrder: 2 },
	{ slug: 'other', label: 'Other (specify in contact)', sortOrder: 3 },
];

const SEED_PRICES_HIGH: Array<{ scooterId: string; days: number; priceEur: number }> = [
	{ scooterId: 'liberty-125', days: 1, priceEur: 35 }, { scooterId: 'liberty-125', days: 2, priceEur: 66 }, { scooterId: 'liberty-125', days: 3, priceEur: 93 }, { scooterId: 'liberty-125', days: 4, priceEur: 116 }, { scooterId: 'liberty-125', days: 5, priceEur: 135 }, { scooterId: 'liberty-125', days: 6, priceEur: 150 }, { scooterId: 'liberty-125', days: 7, priceEur: 161 },
	{ scooterId: 'sh-125', days: 1, priceEur: 35 }, { scooterId: 'sh-125', days: 2, priceEur: 66 }, { scooterId: 'sh-125', days: 3, priceEur: 93 }, { scooterId: 'sh-125', days: 4, priceEur: 116 }, { scooterId: 'sh-125', days: 5, priceEur: 135 }, { scooterId: 'sh-125', days: 6, priceEur: 150 }, { scooterId: 'sh-125', days: 7, priceEur: 161 },
	{ scooterId: 'sim-200', days: 1, priceEur: 45 }, { scooterId: 'sim-200', days: 2, priceEur: 86 }, { scooterId: 'sim-200', days: 3, priceEur: 123 }, { scooterId: 'sim-200', days: 4, priceEur: 156 }, { scooterId: 'sim-200', days: 5, priceEur: 185 }, { scooterId: 'sim-200', days: 6, priceEur: 210 }, { scooterId: 'sim-200', days: 7, priceEur: 231 },
	{ scooterId: 'voge-rally-300', days: 1, priceEur: 55 }, { scooterId: 'voge-rally-300', days: 2, priceEur: 106 }, { scooterId: 'voge-rally-300', days: 3, priceEur: 153 }, { scooterId: 'voge-rally-300', days: 4, priceEur: 196 }, { scooterId: 'voge-rally-300', days: 5, priceEur: 235 }, { scooterId: 'voge-rally-300', days: 6, priceEur: 270 }, { scooterId: 'voge-rally-300', days: 7, priceEur: 301 },
];

const SEED_PRICES_LOW: Array<{ scooterId: string; days: number; priceEur: number }> = [
	{ scooterId: 'liberty-125', days: 1, priceEur: 25 }, { scooterId: 'liberty-125', days: 2, priceEur: 46 }, { scooterId: 'liberty-125', days: 3, priceEur: 63 }, { scooterId: 'liberty-125', days: 4, priceEur: 76 }, { scooterId: 'liberty-125', days: 5, priceEur: 85 }, { scooterId: 'liberty-125', days: 6, priceEur: 90 }, { scooterId: 'liberty-125', days: 7, priceEur: 105 },
	{ scooterId: 'sh-125', days: 1, priceEur: 25 }, { scooterId: 'sh-125', days: 2, priceEur: 46 }, { scooterId: 'sh-125', days: 3, priceEur: 63 }, { scooterId: 'sh-125', days: 4, priceEur: 76 }, { scooterId: 'sh-125', days: 5, priceEur: 85 }, { scooterId: 'sh-125', days: 6, priceEur: 90 }, { scooterId: 'sh-125', days: 7, priceEur: 105 },
	{ scooterId: 'sim-200', days: 1, priceEur: 35 }, { scooterId: 'sim-200', days: 2, priceEur: 66 }, { scooterId: 'sim-200', days: 3, priceEur: 93 }, { scooterId: 'sim-200', days: 4, priceEur: 116 }, { scooterId: 'sim-200', days: 5, priceEur: 135 }, { scooterId: 'sim-200', days: 6, priceEur: 150 }, { scooterId: 'sim-200', days: 7, priceEur: 161 },
	{ scooterId: 'voge-rally-300', days: 1, priceEur: 45 }, { scooterId: 'voge-rally-300', days: 2, priceEur: 86 }, { scooterId: 'voge-rally-300', days: 3, priceEur: 123 }, { scooterId: 'voge-rally-300', days: 4, priceEur: 156 }, { scooterId: 'voge-rally-300', days: 5, priceEur: 185 }, { scooterId: 'voge-rally-300', days: 6, priceEur: 210 }, { scooterId: 'voge-rally-300', days: 7, priceEur: 231 },
];

export const POST: APIRoute = async ({ request }) => {
	if (!isAdminAuthenticated(request)) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}
	const db = getDb();
	if (!db) {
		return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
	}
	try {
		for (const loc of SEED_LOCATIONS) {
			await db.collection('locations').doc(loc.slug).set({ slug: loc.slug, label: loc.label, sortOrder: loc.sortOrder }, { merge: true });
		}
		for (const p of SEED_PRICES_HIGH) {
			const id = `${p.scooterId}_high_${p.days}`;
			await db.collection('prices').doc(id).set({ scooterId: p.scooterId, season: 'high', days: p.days, priceEur: p.priceEur }, { merge: true });
		}
		for (const p of SEED_PRICES_LOW) {
			const id = `${p.scooterId}_low_${p.days}`;
			await db.collection('prices').doc(id).set({ scooterId: p.scooterId, season: 'low', days: p.days, priceEur: p.priceEur }, { merge: true });
		}
		return new Response(JSON.stringify({ ok: true, message: 'Seed complete' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: 'Seed failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
};
