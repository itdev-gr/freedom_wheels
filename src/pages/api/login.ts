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

	// Exchange the (short-lived, 1-hour) ID token for a long-lived Firebase
	// session cookie so the admin stays signed in for the full cookie lifetime
	// instead of being logged out after an hour.
	const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days
	let sessionCookie: string;
	try {
		sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
	} catch {
		return json({ error: 'Invalid token' }, 401);
	}

	const cookieHeader = setSessionCookieHeader(sessionCookie);
	return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader });
};
