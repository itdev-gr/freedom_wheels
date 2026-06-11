import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBookingTotal, getSeason } from '../src/lib/pricing.ts';

const prices = [
	{ scooter_id: 'liberty-125', season: 'low', days: 3, price_eur: 60 },
	{ scooter_id: 'liberty-125', season: 'high', days: 3, price_eur: 90 },
	{ scooter_id: 'liberty-125', season: 'low', days: 7, price_eur: 140 },
];

// Mirrors real-world data where the Firestore doc id differs from the slug
// (docs created in the console get auto ids; dashboard slug edits keep the old id)
const locations = [
	{ id: 'chania-store', slug: 'chania-store', price_eur: null },
	{ id: '8fKxQ2abc', slug: 'chania-airport', price_eur: 20 },
	{ id: 'chania-port', slug: 'chania-port', price_eur: 10 },
];

test('computes base price from the price matrix', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-04',
		pickupLocationId: 'chania-store',
		returnLocationId: 'chania-store',
		prices,
		locations,
	});
	assert.deepEqual(result, { totalEur: 60, totalDays: 3 });
});

test('adds pickup location fee when location is selected by slug but stored under a different doc id', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-04',
		pickupLocationId: 'chania-airport',
		returnLocationId: 'chania-store',
		prices,
		locations,
	});
	assert.deepEqual(result, { totalEur: 80, totalDays: 3 });
});

test('adds both pickup and return fees for different paid locations', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-04',
		pickupLocationId: 'chania-airport',
		returnLocationId: 'chania-port',
		prices,
		locations,
	});
	assert.deepEqual(result, { totalEur: 90, totalDays: 3 });
});

test('charges a paid location twice when pickup and return are the same (delivery + collection)', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-04',
		pickupLocationId: 'chania-airport',
		returnLocationId: 'chania-airport',
		prices,
		locations,
	});
	assert.deepEqual(result, { totalEur: 100, totalDays: 3 });
});

test('extrapolates beyond 7 days from the 7-day price', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-11',
		pickupLocationId: 'chania-store',
		returnLocationId: 'chania-store',
		prices,
		locations,
	});
	// 140 + (140/7) * 3 extra days = 200
	assert.deepEqual(result, { totalEur: 200, totalDays: 10 });
});

test('uses high season pricing for a July pickup', () => {
	const result = computeBookingTotal({
		scooterId: 'liberty-125',
		pickupDate: '2026-07-01',
		returnDate: '2026-07-04',
		pickupLocationId: 'chania-store',
		returnLocationId: 'chania-store',
		prices,
		locations,
	});
	assert.deepEqual(result, { totalEur: 90, totalDays: 3 });
});

test('returns null when no price row exists for the scooter/season/days', () => {
	const result = computeBookingTotal({
		scooterId: 'unknown-model',
		pickupDate: '2026-04-01',
		returnDate: '2026-04-04',
		pickupLocationId: 'chania-store',
		returnLocationId: 'chania-store',
		prices,
		locations,
	});
	assert.equal(result, null);
});

test('returns null for invalid date ranges (under 2 days or reversed)', () => {
	const base = {
		scooterId: 'liberty-125',
		pickupLocationId: 'chania-store',
		returnLocationId: 'chania-store',
		prices,
		locations,
	};
	assert.equal(computeBookingTotal({ ...base, pickupDate: '2026-04-01', returnDate: '2026-04-02' }), null);
	assert.equal(computeBookingTotal({ ...base, pickupDate: '2026-04-04', returnDate: '2026-04-01' }), null);
	assert.equal(computeBookingTotal({ ...base, pickupDate: '', returnDate: '2026-04-04' }), null);
});

test('season boundaries match the booking page logic', () => {
	assert.equal(getSeason('2026-06-14'), 'low');
	assert.equal(getSeason('2026-06-15'), 'high');
	assert.equal(getSeason('2026-09-30'), 'high');
	assert.equal(getSeason('2026-10-01'), 'low');
});
