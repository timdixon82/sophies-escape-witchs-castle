# Carol: Re-test Findings — PR 23, fix/sewc-accessibility

Date: 2026-06-01
Branch: fix/sewc-accessibility
Re-test scope: Two rework items — skip link focus delivery and service worker VERSION bump.

## A. Skip link focus delivery (rework item 1)

### Source check

`index.html` line 61: `<main id="game-main" tabindex="-1">` — confirmed. The `tabindex="-1"` attribute is present in source.

### Runtime focus test

`base.css` line 91 applies `display: contents` to `#game-main`:

```css
#game-main {
  display: contents;
}
```

At runtime, `#game-main` has computed `display: contents`, `width: 0`, `height: 0`. Browsers cannot deliver focus to an element with `display: contents` because the element has no layout box. The `tabindex="-1"` attribute is present but ineffective.

Test: after closing the dialog and calling `document.getElementById('game-main').focus()`, `document.activeElement` remains `BODY`. Activating the skip link (`.click()`) moves the URL hash to `#game-main` but focus stays on `BODY`.

Result: FAIL. The rework item is incomplete. Adding `tabindex="-1"` to the HTML is necessary but not sufficient. The CSS `display: contents` must also be changed. Any value that gives the element a layout box (for example `display: block`) will allow focus delivery. The skip link still fails WCAG 2.4.1 Bypass Blocks (Level A).

## B. Service worker VERSION (rework item 2)

`public/sw.js` line 19: `const VERSION = '0.2.0';`

Cache names derived from VERSION:
- `core-cache-v0.2.0`
- `room-cache-v0.2.0`
- `runtime-cache-v0.2.0`

The activate handler deletes any cache key not in `ALL_CACHES`, which now includes the `v0.2.0` names. Returning visitors with `v0.1.0` caches will have them evicted on SW update, and fresh resources including the updated `index.html` will be fetched.

Result: PASS. VERSION is `'0.2.0'` as required.

## C. Cell door — regression (kbd list after puzzle solve)

Steps taken:
1. New Game started.
2. Kbd list before solve: Bent spoon, Candle stub, Heavy wooden door (use bent spoon to open).
3. Clicked "Bent spoon" via JavaScript (canvas intercepts pointer events). Bent spoon removed from list.
4. Clicked "Heavy wooden door (use bent spoon to open)" via JavaScript.
5. Kbd list after solve: Candle stub, Door to Stone Corridor.

The door entry correctly updates from the locked-door label to "Door to Stone Corridor" after the puzzle is solved.

Result: PASS. No regression on cell door behaviour.

## D. Unit tests

`npm --prefix "/Users/timdixon/Code/Github/sophies-escape-witchs-castle" test -- --run`

Output: 2 test files passed, 33 tests passed, 0 failures.

Result: PASS.

## Summary

| Test | Result |
|------|--------|
| A. tabindex="-1" present in source | Pass |
| A. Focus delivered to game-main at runtime | FAIL — display:contents blocks focus |
| B. sw.js VERSION = '0.2.0' | Pass |
| C. kbd list shows "Door to Stone Corridor" post-solve | Pass |
| D. Unit tests (33/33) | Pass |

## Verdict

FAIL — one rework item remains incomplete.

Rework item 1 (skip link focus delivery) is not fixed. The `tabindex="-1"` attribute was added to `index.html`, which is correct, but `base.css` applies `display: contents` to `#game-main`. Elements with `display: contents` have no layout box and cannot receive focus in any browser. Focus bounces to `BODY` after skip link activation. WCAG 2.4.1 Bypass Blocks is still unmet.

The fix needed is to change `#game-main { display: contents; }` in `base.css` to a value that creates a layout box and still satisfies the layout intent. If the intent is for `<main>` to be invisible in layout (acting as a structural wrapper), an alternative that preserves layout transparency is to keep the element off-screen but reachable, or to use a different approach such as wrapping the skip link target in a zero-height block. The simplest correct fix is `display: block` with any needed layout overrides, or applying `display: contents` only when no skip link activation is pending. Sean should consult Jacob on whether changing `display: contents` breaks the Three.js canvas layout before making the change.

Rework item 2 (SW VERSION bump to 0.2.0) is confirmed fixed.

Route rework flag to Sean: `#game-main { display: contents }` in `base.css` defeats `tabindex="-1"`. Fix the CSS so the element can receive focus.

---

## Final re-check — 2026-06-01

Branch commit: `16b0aa3 fix(a11y): use hidden span as skip-link focus target (display:contents blocks focus on main)`

Re-check scope: Three targeted tests only — skip link href, skip link focus delivery, unit tests.

Note on browser state: the initial page load served a cached `index.html` from the service worker (SW v0.1.0 cache). All service worker registrations and caches were cleared before testing. Subsequent load served the updated `index.html` from the Vite dev server, confirming the new content was correctly fetched once the old SW cache was evicted.

### Test 1 — Skip link href

```js
document.querySelector('.skip-link').getAttribute('href');
// returned: '#game-main-focus'
```

Result: PASS. Value is `#game-main-focus` as required.

### Test 2 — Skip link focus delivery

The main-menu dialog was dismissed (New Game clicked) before the test.

```js
document.querySelector('.skip-link').click();
document.activeElement.id;
// returned: 'game-main-focus'
document.activeElement.tagName;
// returned: 'SPAN'
```

`activeElement.id` is `game-main-focus`. The URL updated to `#game-main-focus`. The `<span>` is absolutely positioned with `width:0; height:0` which gives it a layout box — browsers can deliver focus to it, unlike `display:contents`. `aria-hidden="true"` keeps it out of the accessibility tree, so it acts as a structural focus receiver only; the next Tab from that position moves the user into the game HUD controls inside `<main>`.

Screenshot saved: `screenshots/final-02-skip-link-focus-correct.png`

Result: PASS. Focus lands on `game-main-focus`. WCAG 2.4.1 Bypass Blocks is now met.

### Test 3 — Unit tests

```
npm --prefix "/Users/timdixon/Code/Github/sophies-escape-witchs-castle" test -- --run
```

Output: 2 test files passed, 33 tests passed, 0 failures.

Result: PASS.

### Final re-check summary

| Test | Result |
|------|--------|
| 1. Skip link href = '#game-main-focus' | PASS |
| 2. activeElement.id = 'game-main-focus' after click | PASS |
| 3. Unit tests 33/33 | PASS |

### Final verdict

PASS. All three targeted tests pass.

PR 23 (`fix/sewc-accessibility`) is ready to merge. The skip link now correctly delivers focus to the `#game-main-focus` span — a hidden but focusable structural element inside `<main>` — resolving the WCAG 2.4.1 Bypass Blocks failure identified in the prior re-check. The service worker VERSION bump (v0.2.0) confirmed from previous re-check remains in place. Unit test suite passes at 33/33.
