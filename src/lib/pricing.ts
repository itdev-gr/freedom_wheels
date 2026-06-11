import type { Firestore } from 'firebase-admin/firestore';

export type PriceRow = { scooter_id: string; season: string; days: number; price_eur: number };
export type LocationRow = { id: string; slug?: string; price_eur?: number | null };

export async function fetchPricingData(db: Firestore): Promise<{ prices: PriceRow[]; locations: LocationRow[] }> {
	const [priceSnap, locSnap] = await Promise.all([
		db.collection('prices').get(),
		db.collection('locations').get(),
	]);
	const prices = priceSnap.docs.map((d) => {
		const data = d.data();
		return {
			scooter_id: data.scooterId,
			season: data.season,
			days: data.days,
			price_eur: data.priceEur,
		};
	});
	const locations = locSnap.docs.map((d) => {
		const data = d.data();
		return {
			id: d.id,
			slug: data.slug,
			price_eur: data.priceEur != null ? data.priceEur : null,
		};
	});
	return { prices, locations };
}

// Season boundaries must stay in sync with the inline script in src/pages/[lang]/booking.astro
export function getSeason(dateStr: string): 'low' | 'high' {
	const d = new Date(dateStr);
	const month = d.getMonth() + 1;
	const day = d.getDate();
	if (month < 6) return 'low';
	if (month > 9) return 'low';
	if (month === 6 && day < 15) return 'low';
	return 'high';
}

function getTotalDays(pickupDate: string, returnDate: string): number | null {
	if (!pickupDate || !returnDate) return null;
	const a = new Date(pickupDate);
	const b = new Date(returnDate);
	if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return null;
	const diff = Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
	return diff < 2 ? null : diff;
}

function getPriceFromMatrix(prices: PriceRow[], scooterId: string, season: string, days: number): number {
	const row = prices.find((p) => p.scooter_id === scooterId && p.season === season && p.days === days);
	return row ? Number(row.price_eur) : NaN;
}

// A location can be referenced by its Firestore doc id or by its slug — they can
// differ (console-created docs get auto ids; dashboard slug edits keep the old id).
function matchesLocation(loc: LocationRow, selected: string): boolean {
	return selected !== '' && (loc.id === selected || loc.slug === selected);
}

// The fee applies per trip: once for delivery (pickup) and once for collection
// (return), even when both happen at the same location.
function getLocationFee(locations: LocationRow[], pickupLocationId: string, returnLocationId: string): number {
	let fee = 0;
	for (const loc of locations) {
		if (loc.price_eur == null) continue;
		if (matchesLocation(loc, pickupLocationId)) fee += Number(loc.price_eur);
		if (matchesLocation(loc, returnLocationId)) fee += Number(loc.price_eur);
	}
	return fee;
}

export function computeBookingTotal(args: {
	scooterId: string;
	pickupDate: string;
	returnDate: string;
	pickupLocationId: string;
	returnLocationId: string;
	prices: PriceRow[];
	locations: LocationRow[];
}): { totalEur: number; totalDays: number } | null {
	const totalDays = getTotalDays(args.pickupDate, args.returnDate);
	if (totalDays == null) return null;

	const season = getSeason(args.pickupDate);
	let baseTotal = NaN;
	if (totalDays <= 7) {
		baseTotal = getPriceFromMatrix(args.prices, args.scooterId, season, totalDays);
	} else {
		const price7 = getPriceFromMatrix(args.prices, args.scooterId, season, 7);
		if (!isNaN(price7) && price7 > 0) {
			baseTotal = price7 + (price7 / 7) * (totalDays - 7);
		}
	}
	if (isNaN(baseTotal)) return null;

	const locationFee = getLocationFee(args.locations, args.pickupLocationId, args.returnLocationId);
	return { totalEur: baseTotal + locationFee, totalDays };
}
