import type { APIRoute } from 'astro';
import { getDb } from '../../lib/firebase';
import { isAdminAuthenticated } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('locations').orderBy('sortOrder').get();
		const locations = snap.docs.map((d) => {
			const data = d.data();
			return { id: d.id, slug: data.slug, label: data.label, sort_order: data.sortOrder };
		});
		return json(locations);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch locations' }, 500);
	}
};

export const POST: APIRoute = async ({ request }) => {
	if (!(await isAdminAuthenticated(request))) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = await request.json() as { slug?: string; label?: string; sort_order?: number };
		const slug = String(body.slug ?? '').trim();
		const label = String(body.label ?? '').trim();
		const sortOrder = Number(body.sort_order) || 0;
		if (!slug) return json({ error: 'slug required' }, 400);
		const ref = db.collection('locations').doc(slug);
		await ref.set({ slug, label, sortOrder });
		return json({ id: slug, slug, label, sort_order: sortOrder });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create location' }, 500);
	}
};

export const PUT: APIRoute = async ({ request }) => {
	if (!(await isAdminAuthenticated(request))) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = await request.json() as { id?: string; slug?: string; label?: string; sort_order?: number };
		const id = String(body.id ?? body.slug ?? '').trim();
		if (!id) return json({ error: 'id or slug required' }, 400);
		const ref = db.collection('locations').doc(id);
		const update: Record<string, unknown> = {};
		if (body.slug !== undefined) update.slug = String(body.slug).trim();
		if (body.label !== undefined) update.label = String(body.label).trim();
		if (body.sort_order !== undefined) update.sortOrder = Number(body.sort_order);
		await ref.update(update);
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update location' }, 500);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	if (!(await isAdminAuthenticated(request))) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	const url = new URL(request.url);
	const id = url.searchParams.get('id')?.trim();
	if (!id) return json({ error: 'id required' }, 400);
	try {
		await db.collection('locations').doc(id).delete();
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to delete location' }, 500);
	}
};
