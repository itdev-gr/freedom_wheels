import type { APIRoute } from 'astro';
import { getPrices } from '../../lib/store';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const scooter = url.searchParams.get('scooter');
	const season = url.searchParams.get('season');
	const daysParam = url.searchParams.get('days');
	try {
		let prices = await getPrices();
		if (scooter) prices = prices.filter((p) => p.scooter_id === scooter);
		if (season) prices = prices.filter((p) => p.season === season);
		if (daysParam) prices = prices.filter((p) => p.days === parseInt(daysParam, 10));
		return json(prices);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch prices' }, 500);
	}
};
