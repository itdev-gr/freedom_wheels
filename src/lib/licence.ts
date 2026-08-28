// Driving-licence category required per scooter id (the id is the scooter
// "code" used across booking.astro, scooters.ts and the price matrix).
//
// Greek/EU rules: A1 covers up to 125cc / 11kW. The 200cc and 300cc models
// need an A2 licence, so the checkout confirmation must say A2 for them.
export type LicenceCategory = 'A1' | 'A2';

// NOTE: src/pages/[lang]/checkout.astro ships this list to its inline script
// via define:vars and re-implements the membership check there (an Astro
// `<script is:inline>` cannot import a TS module). Keep this a plain list of
// ids — if getRequiredLicence() ever becomes rule-based, update that page too.
export const A2_SCOOTER_IDS: readonly string[] = ['sim-200', 'voge-rally-300'];

export function getRequiredLicence(scooterId: string): LicenceCategory {
	return A2_SCOOTER_IDS.includes(scooterId) ? 'A2' : 'A1';
}
