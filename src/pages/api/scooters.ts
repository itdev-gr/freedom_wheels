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

const DEFAULT_SCOOTER_IDS = ['sh-125', 'liberty-125', 'sim-200', 'voge-rally-300'];
const DEFAULT_LABELS: Record<string, string> = {
	'sh-125': 'SH 125',
	'liberty-125': 'LIBERTY 125',
	'sim-200': 'SIM 200',
	'voge-rally-300': 'VOGE RALLY 300',
};

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('scooters').get();
		const byId: Record<string, { id: string; label: string; quantity: number }> = {};
		for (const id of DEFAULT_SCOOTER_IDS) {
			byId[id] = { id, label: DEFAULT_LABELS[id] ?? id, quantity: 0 };
		}
		snap.docs.forEach((d) => {
			const data = d.data();
			byId[d.id] = {
				id: d.id,
				label: data.label ?? DEFAULT_LABELS[d.id] ?? d.id,
				quantity: Number(data.quantity) || 0,
			};
		});
		const list = Object.values(byId);
		return json(list);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch scooters' }, 500);
	}
};

export const PUT: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as { id: string; label?: string; quantity?: number };
		const id = String(body.id ?? '').trim();
		if (!id) return json({ error: 'id required' }, 400);
		const ref = db.collection('scooters').doc(id);
		const update: Record<string, unknown> = {};
		if (body.label !== undefined) update.label = String(body.label).trim();
		if (body.quantity !== undefined) update.quantity = Number(body.quantity) || 0;
		if (Object.keys(update).length > 0) await ref.set(update, { merge: true });
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update scooter' }, 500);
	}
};
