import type { APIRoute } from 'astro';
import { submitRecord } from '../../lib/supabase';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = (await request.json()) as {
			name?: string;
			email?: string;
			phone?: string;
			message?: string;
		};
		const name = String(body.name ?? '').trim().slice(0, 200);
		const email = String(body.email ?? '').trim().slice(0, 200);
		const phone = String(body.phone ?? '').trim().slice(0, 100);
		const message = String(body.message ?? '').trim().slice(0, 5000);

		if (!name) return json({ error: 'Name is required' }, 400);
		if (!email) return json({ error: 'Email is required' }, 400);
		if (!message) return json({ error: 'Message is required' }, 400);

		await submitRecord('messages', {
			name,
			email,
			phone,
			message,
			read: false,
			createdAt: new Date().toISOString(),
		});

		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to send message' }, 500);
	}
};
