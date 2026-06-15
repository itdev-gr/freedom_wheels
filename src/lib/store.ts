import { listRecords } from './supabase.ts';

// In-memory TTL cache for the near-static catalog collections (prices,
// locations, scooters). These change only when an admin edits them in the
// central dashboard, but would otherwise be re-read from the backend on every
// public booking page view and every checkout. Caching collapses thousands of
// reads into roughly one per collection per TTL window per warm instance.
//
// (Catalog writes now happen in the separate central dashboard, not this site,
// so this site no longer needs an invalidate() hook — entries simply refresh
// within TTL.)

const TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
	const hit = cache.get(key) as CacheEntry<T> | undefined;
	if (hit && hit.expires > Date.now()) return hit.value;
	const value = await loader();
	cache.set(key, { value, expires: Date.now() + TTL_MS });
	return value;
}

export function invalidate(key: 'prices' | 'locations' | 'scooters'): void {
	cache.delete(key);
}

export type PriceRow = { scooter_id: string; season: string; days: number; price_eur: number };
export type LocationRow = {
	id: string;
	slug: string;
	label: string;
	sort_order: number;
	price_eur: number | null;
};
export type ScooterRow = { id: string; label: string | null; quantity: number };

export function getPrices(): Promise<PriceRow[]> {
	return cached('prices', async () => {
		const records = await listRecords('prices');
		return records.map((data) => ({
			scooter_id: data.scooterId as string,
			season: data.season as string,
			days: data.days as number,
			price_eur: data.priceEur as number,
		}));
	});
}

export function getLocations(): Promise<LocationRow[]> {
	return cached('locations', async () => {
		const records = await listRecords('locations');
		const locations = records.map((data) => ({
			// The app's location identifier IS the slug.
			id: data.slug as string,
			slug: data.slug as string,
			label: data.label as string,
			sort_order: data.sortOrder as number,
			price_eur: data.priceEur != null ? (data.priceEur as number) : null,
		}));
		locations.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
		return locations;
	});
}

export function getScooters(): Promise<ScooterRow[]> {
	return cached('scooters', async () => {
		const records = await listRecords('scooters');
		return records.map((data) => ({
			// The app's scooter "id" IS the code.
			id: data.code as string,
			label: (data.label as string) ?? null,
			quantity: Number(data.quantity) || 0,
		}));
	});
}
