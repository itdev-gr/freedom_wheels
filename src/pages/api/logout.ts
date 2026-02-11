import type { APIRoute } from 'astro';
import { clearSessionCookieHeader } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers } as HeadersInit,
	});
}

export const POST: APIRoute = async () => {
	const cookieHeader = clearSessionCookieHeader();
	return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader });
};
