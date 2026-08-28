import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRequiredLicence, A2_SCOOTER_IDS } from '../src/lib/licence.ts';

test('SYM SIM 200 requires an A2 licence', () => {
	assert.equal(getRequiredLicence('sim-200'), 'A2');
});

test('VOGE RALLY 300 requires an A2 licence', () => {
	assert.equal(getRequiredLicence('voge-rally-300'), 'A2');
});

test('125cc scooters require an A1 licence', () => {
	assert.equal(getRequiredLicence('sh-125'), 'A1');
	assert.equal(getRequiredLicence('liberty-125'), 'A1');
});

test('unknown or empty scooter ids fall back to A1', () => {
	assert.equal(getRequiredLicence('unknown-model'), 'A1');
	assert.equal(getRequiredLicence(''), 'A1');
});

test('A2_SCOOTER_IDS lists exactly the two A2 models', () => {
	assert.deepEqual([...A2_SCOOTER_IDS].sort(), ['sim-200', 'voge-rally-300']);
});
