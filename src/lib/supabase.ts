import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read public env from Vite/Astro (import.meta.env) at runtime, falling back to
// process.env so this module can also be imported outside the bundler (e.g. the
// node:test runner, where import.meta.env is undefined) without throwing on load.
function env(key: string): string {
	const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
	return (metaEnv?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined) ?? '') as string;
}

const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = env('PUBLIC_SUPABASE_ANON_KEY');

export const PROJECT_ID = env('PUBLIC_PROJECT_ID');

// Anon (publishable) Supabase client. Reads of this PUBLIC project's
// `collections` and `records` are allowed with the anon key; writes go
// exclusively through the two anon-safe RPCs below. There is intentionally NO
// service-role key in this site.
//
// Lazily created so merely importing this module never throws when env is
// absent (e.g. unit tests that import the pricing chain); it is initialised on
// first actual use.
let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
	if (_client) return _client;
	_client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	return _client;
}

// slug -> collection id cache. Collections are static per project, so resolving
// a slug once per warm instance is plenty.
const collectionIdCache = new Map<string, string>();

export async function getCollectionId(slug: string): Promise<string> {
	const cached = collectionIdCache.get(slug);
	if (cached) return cached;
	const { data, error } = await client()
		.from('collections')
		.select('id')
		.eq('project_id', PROJECT_ID)
		.eq('slug', slug)
		.single();
	if (error) throw error;
	if (!data) throw new Error(`Collection not found for slug: ${slug}`);
	const id = String(data.id);
	collectionIdCache.set(slug, id);
	return id;
}

// Returns the raw `data` jsonb of every record in the given collection.
export async function listRecords(slug: string): Promise<Record<string, unknown>[]> {
	const collectionId = await getCollectionId(slug);
	const { data, error } = await client()
		.from('records')
		.select('data')
		.eq('collection_id', collectionId);
	if (error) throw error;
	return (data ?? []).map((r) => (r as { data: Record<string, unknown> }).data);
}

// Inserts a record into the given collection via the anon-safe RPC. Returns the
// new record id.
export async function submitRecord(slug: string, data: Record<string, unknown>): Promise<string> {
	const { data: newId, error } = await client().rpc('submit_record', {
		p_project_id: PROJECT_ID,
		p_collection_slug: slug,
		p_data: data,
	});
	if (error) throw error;
	return String(newId);
}

// Returns the number of active (non-cancelled) bookings for a scooter that
// overlap the given date range. Used for the availability check.
export async function countActiveBookings(
	scooter: string,
	pickup: string,
	returnDate: string
): Promise<number> {
	const { data, error } = await client().rpc('count_active_bookings', {
		p_project_id: PROJECT_ID,
		p_scooter: scooter,
		p_pickup: pickup,
		p_return: returnDate,
	});
	if (error) throw error;
	return Number(data) || 0;
}
