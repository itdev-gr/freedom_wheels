import type { APIRoute } from 'astro';
import { getScooters } from '../../lib/store';

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
	try {
		const scooters = await getScooters();
		const byId: Record<string, { id: string; label: string; quantity: number }> = {};
		for (const id of DEFAULT_SCOOTER_IDS) {
			byId[id] = { id, label: DEFAULT_LABELS[id] ?? id, quantity: 0 };
		}
		for (const s of scooters) {
			byId[s.id] = {
				id: s.id,
				label: s.label ?? DEFAULT_LABELS[s.id] ?? s.id,
				quantity: Number(s.quantity) || 0,
			};
		}
		return json(Object.values(byId));
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch scooters' }, 500);
	}
};
