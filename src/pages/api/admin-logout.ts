import type { APIRoute } from 'astro';
import { clearAuthCookie } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
	return new Response(null, {
		status: 302,
		headers: {
			'Location': '/admin',
			'Set-Cookie': clearAuthCookie(),
		},
	});
};
