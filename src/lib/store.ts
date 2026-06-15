import type { Firestore } from 'firebase-admin/firestore';

// In-memory TTL cache for the near-static catalog collections (prices,
// locations, scooters). These change only when an admin edits them in the
// dashboard, but were being re-read from Firestore on every public booking
// page view and every checkout — which exhausted the Firestore free-tier
// daily read quota and took the site down. Caching collapses thousands of
// reads into roughly one per collection per TTL window per warm instance.
//
// Writes (dashboard edits) call invalidate() so the same instance reflects
// the change immediately; other instances pick it up within TTL_MS.

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

export function getPrices(db: Firestore): Promise<PriceRow[]> {
	return cached('prices', async () => {
		const snap = await db.collection('prices').get();
		return snap.docs.map((d) => {
			const data = d.data();
			return {
				scooter_id: data.scooterId,
				season: data.season,
				days: data.days,
				price_eur: data.priceEur,
			};
		});
	});
}

export function getLocations(db: Firestore): Promise<LocationRow[]> {
	return cached('locations', async () => {
		const snap = await db.collection('locations').get();
		const locations = snap.docs.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				slug: data.slug,
				label: data.label,
				sort_order: data.sortOrder,
				price_eur: data.priceEur != null ? data.priceEur : null,
			};
		});
		locations.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
		return locations;
	});
}

export function getScooters(db: Firestore): Promise<ScooterRow[]> {
	return cached('scooters', async () => {
		const snap = await db.collection('scooters').get();
		return snap.docs.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				label: data.label ?? null,
				quantity: Number(data.quantity) || 0,
			};
		});
	});
}
