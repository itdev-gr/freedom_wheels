import type { APIRoute } from 'astro';
import { verifySession, setSessionCookieHeader } from '../../lib/auth';
import { getAdminAuth } from '../../lib/firebase';

export const prerender = false;

function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers } as HeadersInit,
	});
}

export const POST: APIRoute = async ({ request }) => {
	if (request.headers.get('Content-Type')?.includes('application/json') === false) {
		return json({ error: 'Expected JSON' }, 400);
	}
	let body: { idToken?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, 400);
	}
	const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : null;
	if (!idToken) return json({ error: 'idToken required' }, 400);

	const auth = getAdminAuth();
	if (!auth) return json({ error: 'Auth not configured' }, 503);
	try {
		await auth.verifyIdToken(idToken);
	} catch {
		return json({ error: 'Invalid token' }, 401);
	}

	const cookieHeader = setSessionCookieHeader(idToken);
	return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader });
};
