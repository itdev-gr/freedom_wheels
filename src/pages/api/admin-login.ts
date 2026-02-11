import type { APIRoute } from 'astro';
import { getAdminAuth } from '../../lib/firebase';
import { setAuthCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => ({})) as { idToken?: string };
	const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
	if (!idToken) {
		return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	const auth = getAdminAuth();
	if (!auth) {
		return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	try {
		const decoded = await auth.verifyIdToken(idToken);
		if (decoded.customClaims?.admin !== true) {
			return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Set-Cookie': setAuthCookie(idToken),
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
