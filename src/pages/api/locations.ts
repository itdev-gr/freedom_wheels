import type { APIRoute } from 'astro';
import { getLocations } from '../../lib/store';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const GET: APIRoute = async () => {
	try {
		const locations = await getLocations();
		return json(locations);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch locations' }, 500);
	}
};
