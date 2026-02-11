import type { APIRoute } from 'astro';
import { createSessionCookie } from '../../lib/auth';

export const prerender = false;

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || '';

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => ({})) as { password?: string };
	const password = String(body.password ?? '').trim();
	if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
		return new Response(JSON.stringify({ error: 'Invalid password' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': createSessionCookie(),
		},
	});
};
