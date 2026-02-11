import type { APIRoute } from 'astro';
import { createSessionCookie } from '../../lib/auth';

export const prerender = false;

const ADMIN_EMAIL = (import.meta.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || '';

export const POST: APIRoute = async ({ request }) => {
	const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
	const email = String(body.email ?? '').trim().toLowerCase();
	const password = String(body.password ?? '').trim();
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD || email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
		return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
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
