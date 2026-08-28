# A2 Licence Notice for 200cc/300cc Scooters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the checkout page, the driving-licence confirmation checkbox (and its validation error) must say **A2** instead of **A1** when the customer is booking the SYM SIM/Symphony 200 (`sim-200`) or the VOGE RALLY 300 (`voge-rally-300`). All other scooters keep the current A1 wording.

**Architecture:** The checkout page (`src/pages/[lang]/checkout.astro`) does not know the scooter server-side — the selected model only lives in `localStorage['fw_checkout'].model`, written by `booking.astro`. So we (1) add a tiny pure module `src/lib/licence.ts` that maps a scooter id → required licence category (single source of truth, unit-tested), (2) add A2 variants of the two locale strings in `en.ts`/`el.ts`, (3) render both A1 and A2 strings into the checkout DOM as data attributes and let the existing inline script pick the right one from `booking.model`. No API, database or Stripe changes are needed — the licence confirmation is a client-side gate only.

**Tech Stack:** Astro 5 (SSR via `@astrojs/vercel`, `prerender = false` pages), TypeScript locale objects, vanilla inline JS (`<script is:inline define:vars>`), Node 24 native test runner (`npm test` → `node --test 'tests/**/*.test.ts'`).

## Global Constraints

- Scooter ids that require A2: exactly `'sim-200'` and `'voge-rally-300'`. Everything else (`'sh-125'`, `'liberty-125'`, unknown) stays A1.
- Do not rename or remove the existing locale keys `checkout.licenceConfirm` / `checkout.licenceError` (they remain the A1 strings). Add new keys `checkout.licenceConfirmA2` / `checkout.licenceErrorA2`.
- Greek copy must use the Latin letters "A1"/"A2" exactly as the existing strings do (the existing `el.ts` strings use Latin `A1`), so grep/i18n stay consistent.
- Tests use `node:test` + `node:assert/strict` and import `.ts` sources directly (Node 24 type-stripping), matching `tests/pricing.test.ts`.
- **This project is NOT a git repository** (`git rev-parse` fails). Commit steps below are written for a repo; if the executor is still not in a git repo, either run `git init && git add -A && git commit -m "chore: baseline"` once before Task 1, or skip the commit steps. Do not initialise git without the user's approval — skipping is the safe default.
- Verify the site still builds: `npm run build` must exit 0 at the end.

---

## File Structure

| File | Action | Responsibility |
| --- | --- | --- |
| `src/lib/licence.ts` | Create | Pure mapping `scooterId → 'A1' \| 'A2'`; exports the A2 id list so pages can ship it to the client. |
| `tests/licence.test.ts` | Create | Unit tests for the mapping. |
| `src/locales/en.ts` | Modify (`checkout` block, lines ~199-200) | Add `licenceConfirmA2`, `licenceErrorA2`. |
| `src/locales/el.ts` | Modify (`checkout` block, lines ~199-200) | Add `licenceConfirmA2`, `licenceErrorA2`. |
| `src/pages/[lang]/checkout.astro` | Modify (frontmatter, line 25, lines 51-56, script lines 272-375) | Ship both strings + A2 id list to the client; swap label/error based on `booking.model`. |

Files scanned and confirmed to need **no change**: `src/pages/[lang]/booking.astro` (already writes `model` into `fw_checkout`), `src/pages/api/create-checkout.ts`, `src/pages/api/public-booking.ts`, `src/pages/api/scooters.ts`, `src/lib/store.ts`, `src/lib/pricing.ts`, `src/pages/[lang]/rental-terms.astro` (term 4 "Driver's Licence" does not mention a category), `src/pages/checkout.astro` (root redirect only), `src/pages/[lang]/book.astro`, `src/pages/[lang]/rentals.astro`.

---

### Task 1: Licence category mapping module

**Files:**
- Create: `src/lib/licence.ts`
- Test: `tests/licence.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type LicenceCategory = 'A1' | 'A2'`
  - `export const A2_SCOOTER_IDS: readonly string[]` — `['sim-200', 'voge-rally-300']`
  - `export function getRequiredLicence(scooterId: string): LicenceCategory`

- [ ] **Step 1: Write the failing test**

Create `tests/licence.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `tests/licence.test.ts` errors with `Cannot find module '.../src/lib/licence.ts'`. (`tests/pricing.test.ts` should still pass.)

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/licence.ts`:

```ts
// Driving-licence category required per scooter id (the id is the scooter
// "code" used across booking.astro, scooters.ts and the price matrix).
//
// Greek/EU rules: A1 covers up to 125cc / 11kW. The 200cc and 300cc models
// need an A2 licence, so the checkout confirmation must say A2 for them.
export type LicenceCategory = 'A1' | 'A2';

export const A2_SCOOTER_IDS: readonly string[] = ['sim-200', 'voge-rally-300'];

export function getRequiredLicence(scooterId: string): LicenceCategory {
	return A2_SCOOTER_IDS.includes(scooterId) ? 'A2' : 'A1';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `tests/licence.test.ts` and `tests/pricing.test.ts` green.

- [ ] **Step 5: Commit** (skip if not a git repo — see Global Constraints)

```bash
git add src/lib/licence.ts tests/licence.test.ts
git commit -m "feat: add scooter -> required licence category mapping"
```

---

### Task 2: A2 locale strings (EN + EL)

**Files:**
- Modify: `src/locales/en.ts:199-200` (inside `checkout: { ... }`)
- Modify: `src/locales/el.ts:199-200` (inside `checkout: { ... }`)

**Interfaces:**
- Consumes: nothing.
- Produces: `t.checkout.licenceConfirmA2: string`, `t.checkout.licenceErrorA2: string` on both locale objects (Task 3 reads them).

- [ ] **Step 1: Add the English strings**

In `src/locales/en.ts`, directly after the existing line

```ts
		licenceError: 'You must confirm that you hold a valid A1 driving licence to proceed.',
```

add:

```ts
		licenceConfirmA2: 'I confirm that I hold a valid A2 driving licence (or equivalent)',
		licenceErrorA2: 'You must confirm that you hold a valid A2 driving licence to proceed.',
```

- [ ] **Step 2: Add the Greek strings**

In `src/locales/el.ts`, directly after the existing line

```ts
		licenceError: 'Πρέπει να επιβεβαιώσετε ότι κατέχετε έγκυρο δίπλωμα οδήγησης A1 για να συνεχίσετε.',
```

add:

```ts
		licenceConfirmA2: 'Επιβεβαιώνω ότι κατέχω έγκυρο δίπλωμα οδήγησης A2 (ή ισοδύναμο)',
		licenceErrorA2: 'Πρέπει να επιβεβαιώσετε ότι κατέχετε έγκυρο δίπλωμα οδήγησης A2 για να συνεχίσετε.',
```

- [ ] **Step 3: Verify both locales expose the new keys**

Run:
```bash
grep -n "licenceConfirmA2\|licenceErrorA2" src/locales/en.ts src/locales/el.ts
```
Expected: 4 lines (2 per file).

- [ ] **Step 4: Verify the project still type-checks/builds**

Run: `npm run build`
Expected: exit 0. (Both locale objects are plain object literals; `checkout.astro` picks `el` or `en` by ternary so both must have identical key sets for TS to be happy where `t` is used.)

- [ ] **Step 5: Commit** (skip if not a git repo)

```bash
git add src/locales/en.ts src/locales/el.ts
git commit -m "feat(i18n): add A2 licence confirmation strings"
```

---

### Task 3: Swap A1 → A2 on the checkout page based on the booked scooter

**Files:**
- Modify: `src/pages/[lang]/checkout.astro`
  - frontmatter (lines 1-20)
  - i18n data element (line 25)
  - licence checkbox markup (lines 51-56)
  - inline script (lines 272-375)

**Interfaces:**
- Consumes: `A2_SCOOTER_IDS` from `src/lib/licence.ts` (Task 1); `t.checkout.licenceConfirmA2`, `t.checkout.licenceErrorA2` (Task 2); `booking.model` from `localStorage['fw_checkout']` (already written by `booking.astro:480-491`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Import the A2 id list in the frontmatter**

In `src/pages/[lang]/checkout.astro`, after

```astro
import el from '../../locales/el';
```

add:

```astro
import { A2_SCOOTER_IDS } from '../../lib/licence';
```

and after

```astro
const ogImage = new URL('/logos/logo.webp', site).href;
```

add:

```astro
// Shipped to the inline script so it can pick A1/A2 wording from booking.model
const a2ScooterIds = [...A2_SCOOTER_IDS];
```

- [ ] **Step 2: Expose the A2 error string to the client**

On line 25 (the `<div id="checkout-lang" ...>` element), add one attribute next to `data-i18n-licence-error={t.checkout.licenceError}`:

```astro
data-i18n-licence-error-a2={t.checkout.licenceErrorA2}
```

The element must end up containing both `data-i18n-licence-error={t.checkout.licenceError}` and `data-i18n-licence-error-a2={t.checkout.licenceErrorA2}`.

- [ ] **Step 3: Make the checkbox label swappable without losing the required asterisk**

Replace lines 51-56:

```astro
					<div class="checkout-field checkout-field--checkbox">
						<label class="checkout-checkbox">
							<input type="checkbox" id="licence-confirm" />
							<span>{t.checkout.licenceConfirm} <span class="required">*</span></span>
						</label>
					</div>
```

with:

```astro
					<div class="checkout-field checkout-field--checkbox">
						<label class="checkout-checkbox">
							<input type="checkbox" id="licence-confirm" />
							<span>
								<span id="licence-confirm-text" data-text-a1={t.checkout.licenceConfirm} data-text-a2={t.checkout.licenceConfirmA2}>{t.checkout.licenceConfirm}</span>
								<span class="required">*</span>
							</span>
						</label>
					</div>
```

(The A1 text is server-rendered as the default; the script below replaces only the inner `#licence-confirm-text` node, so the `*` is preserved.)

- [ ] **Step 4: Pass `a2ScooterIds` into the inline script**

Change line 272:

```astro
	<script is:inline define:vars={{ isSuccess, sessionId }}>
```

to:

```astro
	<script is:inline define:vars={{ isSuccess, sessionId, a2ScooterIds }}>
```

- [ ] **Step 5: Read the A2 error string alongside the A1 one**

In the script, directly after line 281

```js
			var i18nLicenceError = (langEl && langEl.getAttribute('data-i18n-licence-error')) || 'You must confirm that you hold a valid A1 driving licence to proceed.';
```

add:

```js
			var i18nLicenceErrorA2 = (langEl && langEl.getAttribute('data-i18n-licence-error-a2')) || 'You must confirm that you hold a valid A2 driving licence to proceed.';
```

- [ ] **Step 6: Resolve the required licence from `booking.model` and swap the label**

After the summary block that ends with

```js
			if (sumTotal) sumTotal.textContent = '€' + Number(booking.totalEur).toFixed(2);
```

(this is after the `if (!booking) { ...redirect... return; }` guard, so `booking` is non-null here) add:

```js
			// A2 wording for the 200cc/300cc models; A1 for everything else.
			var ids = Array.isArray(a2ScooterIds) ? a2ScooterIds : [];
			var requiredLicence = ids.indexOf(booking.model) !== -1 ? 'A2' : 'A1';
			var licenceErrorMsg = requiredLicence === 'A2' ? i18nLicenceErrorA2 : i18nLicenceError;
			var licenceText = document.getElementById('licence-confirm-text');
			if (licenceText) {
				var attr = requiredLicence === 'A2' ? 'data-text-a2' : 'data-text-a1';
				var txt = licenceText.getAttribute(attr);
				if (txt) licenceText.textContent = txt;
			}
```

- [ ] **Step 7: Use the resolved error message in `validate()`**

Change

```js
				if (licenceBox && !licenceBox.checked) {
					showError(i18nLicenceError);
					return null;
				}
```

to

```js
				if (licenceBox && !licenceBox.checked) {
					showError(licenceErrorMsg);
					return null;
				}
```

- [ ] **Step 8: Build to confirm the page compiles**

Run: `npm run build`
Expected: exit 0, no Astro/TS errors.

- [ ] **Step 9: Manual verification in the browser (both languages, both categories)**

Run: `npm run dev` (dev server at `http://localhost:4321`). Requires the Supabase env vars used by `src/lib/supabase.ts`; if the catalog cannot load, the booking page still renders with fallback data so the flow can be exercised.

For each URL below: pick valid pickup/return dates (≥ 2 days apart), pick locations, click the proceed button to land on `/{lang}/checkout`, then check the checkbox label and — with the checkbox unticked and name/email/phone filled — click **Online Payment / Διαδικτυακή πληρωμή** to trigger the validation error.

| URL | Expected label | Expected error |
| --- | --- | --- |
| `/en/booking?model=voge-rally-300` | "...valid **A2** driving licence (or equivalent) *" | "...valid **A2** driving licence to proceed." |
| `/el/booking?model=sim-200` | "...δίπλωμα οδήγησης **A2** (ή ισοδύναμο) *" | "...δίπλωμα οδήγησης **A2** για να συνεχίσετε." |
| `/en/booking?model=liberty-125` | "...valid **A1** driving licence (or equivalent) *" | "...valid **A1** driving licence to proceed." |
| `/el/booking?model=sh-125` | "...δίπλωμα οδήγησης **A1** (ή ισοδύναμο) *" | "...δίπλωμα οδήγησης **A1** για να συνεχίσετε." |

Also confirm the red `*` is still rendered after the label in all four cases, and that the page still redirects to `/{lang}/book` when `localStorage['fw_checkout']` is absent (open `/en/checkout` directly in a fresh private window).

- [ ] **Step 10: Run the full test suite one last time**

Run: `npm test`
Expected: PASS (licence + pricing tests).

- [ ] **Step 11: Commit** (skip if not a git repo)

```bash
git add 'src/pages/[lang]/checkout.astro'
git commit -m "feat(checkout): require A2 licence confirmation for SIM 200 and VOGE RALLY 300"
```

---

## Self-Review

**Spec coverage**
- "SYM Symphony 200 → A2 at checkout": Task 1 maps `sim-200` → A2; Task 3 swaps label + error. ✔
- "VOGE RALLY 300 → A2 at checkout": Task 1 maps `voge-rally-300` → A2; Task 3. ✔
- Both languages (site is EN/EL): Task 2 adds strings to both locales; Task 3 reads them through the same `t` object the page already uses. ✔
- Other scooters unchanged: `getRequiredLicence` falls back to A1; A1 remains the server-rendered default. ✔

**Placeholder scan** — no TBD/TODO; every code step shows the exact code.

**Type consistency** — `A2_SCOOTER_IDS` (Task 1) is the name imported in Task 3; `licenceConfirmA2` / `licenceErrorA2` (Task 2) are the keys read in Task 3 via `t.checkout.*`; `a2ScooterIds` is the `define:vars` name used in the script.

## Out of scope / notes for the owner

- The customer wrote "SYM **Symphony** 200", but the codebase calls this model "SYM **SIM** 200" everywhere (`sim-200` id, `SCOOTERS` map in `booking.astro:18`, `DEFAULT_LABELS` in `scooters.ts:17`, locale keys `cardSim200`/`sidebarSim200`). The real SYM model is the *Symphony* — the display name may be a typo. Renaming is a separate copy change and is **not** part of this plan.
- Optional follow-up (not requested): show a "requires A2 licence" hint on the booking page (`booking.astro`) and on the `/book` cards for the two models so customers learn it before checkout. `getRequiredLicence()` from Task 1 can be reused server-side there.
- Rental terms (§4 "Driver's Licence") don't mention a category, so no change there.
