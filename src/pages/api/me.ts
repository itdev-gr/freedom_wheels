import type { APIRoute } from 'astro';
import { verifySession } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const GET: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	return json({ uid: session.uid, email: session.email });
};
