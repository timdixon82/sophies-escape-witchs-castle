# Log: 018-sophies-escape-setup

## [2026-05-24] open | Work folder created; retroactive backfill dispatched

Sonja opened this work folder at the start of the session. Tim answered Q103A (modified): create the work folder, run the full retroactive backfill, and use a commit-to-main live-test approach rather than mkcert local HTTPS. Tim will still approve every merge.

Local clone confirmed at `/Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-witchs-castle`, on the `feat/v0.1-scaffold` branch (PR 2). Design brief confirmed at `/Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-design-brief.md`.

Four backfill agents dispatched in parallel: Tad (requirements review), Jacob (architecture review), Jed (security review), Carol (baseline WCAG 2.2 AAA audit).

Active folder count after opening this folder: 3 (011 ICCC, 017 JNS, 018 Sophie's Escape). At the three-folder cap.

## [2026-05-24] backfill | All four agents returned — findings consolidated

**Tad (requirements review):** Pass. Requirements doc is thorough. Three blocking items before v0.2: (1) BBC Sound Effects Library licence status unresolved; (2) hint wording absent; (3) item dependency graph incomplete for Rooms 3–10. Nine open questions batched for Tim (Q104–Q112). Missing collated decisions file noted.

**Jacob (architecture review):** Approved with conditions. Architecture is sound. No blocking issues for PR 2 merge. Twelve v0.2 backlog items found. Notable: ADR 002 conformance (intent bus in wrong location), ADR 004 conformance (shallow freeze not deep freeze), ADR 006 analytics bug (first room never fires room-entered event), port mismatch in vite.config.js. Jacob returned 119,187 tokens — over the 80k soft ceiling; reviewed and accepted as substantive (9 ADRs + 50 source files).

**Jed (security review):** Approved with conditions. UK GDPR compliant. OWASP A05 and A08 are conditional passes. Five conditions before 1.0 release (all non-blocking for PR 2 draft merge). Notable: `unsafe-inline` in script-src (ADR 007 deferred), `worker-src blob:` discrepancy.

**Carol (baseline WCAG 2.2 AAA audit):** Conditional pass. Four Level A rework items must be fixed before the AAA gate is met:
1. Focus trap not implemented in overlay-controller.js (WCAG 2.1.2).
2. aria-expanded missing on hint and pause HUD buttons in index.html (4.1.2).
3. Inventory item buttons lack role="listitem" (1.3.1, 4.1.2).
4. Two H1 elements simultaneously in document (1.3.1).
Plus one implementation defect: native dialog cancel event not intercepted, causing overlay state desync. Three new S-series entries recommended (S-13, S-14, S-15). Carol returned 82,650 tokens — over the 80k soft ceiling; accepted as substantive (50 files audited).

Tad also returned 106,426 tokens — over the 80k ceiling; accepted as substantive (780-line requirements doc + 9 ADRs).

## [2026-05-24] dispatch | Sean dispatched to fix four Level A rework items

Sonja dispatched Sean to fix Carol's four rework items plus the dialog cancel event defect on the feat/v0.1-scaffold branch. Carol will re-test once Sean returns.

## [2026-05-24] fix | Sean returned — commit 1835613, all five fixes applied

Sean committed all five fixes to `feat/v0.1-scaffold` and pushed to origin. Commit hash: `1835613`.

Changes:
- `src/ui/overlay-controller.js`: Added NEXT_FOCUSABLE/PREV_FOCUSABLE intent subscribers with `_moveFocusByStep()` helper for focus trap (Fix 1). Added `cancel` event listener calling `e.preventDefault()` to prevent _openStack desync (Fix 5).
- `index.html`: Added `aria-expanded="false"` to hint and pause HUD buttons (Fix 2). Demoted loading screen `<h1>` to `<p class="game-title">` — visual appearance unchanged (Fix 4).
- `src/ui/inventory-panel.js`: Wrapped inventory buttons in `<div role="listitem">` before appending to `role="list"` grid. Stale-item removal updated to target the wrapper (Fix 3).

Build: clean (Vite, 23 modules, no errors). Tests: 17/17 pass. S-series regression suite: all applicable entries pass.

Sean usage: 58,188 tokens, 40 tool calls — under the 80k ceiling.

Carol re-test dispatched.

## [2026-05-24] test | Carol re-test — conditional pass, all rework items resolved

All four Level A rework items and the dialog cancel defect are confirmed resolved. No new issues introduced. S-12 full conditional pass.

Outstanding before v0.1 ships (not blockers for off-draft merge and live test):
- Loading progress bar aria-valuenow must be updated by JavaScript during asset loading. (Sean follow-on.)
- Screen-reader evidence files (manual VoiceOver and JAWS passes) required before formal release.
- Tim's approval of exceptions SE-001 (3D navigation) and SE-002 (3D decorative colours).

Recommended improvements (not blockers): GoatCounter "(opens in new tab)" note; hint-panel dual-buffer pattern.

Carol usage: 41,728 tokens, 6 tool calls.

Merge gate: satisfied. Tim approved.

## [2026-05-24] merge | PR 2 merged to main — commit 15b62e3

Tim approved. PR 2 taken off draft then merged to main at 14:06 UTC. Commit `15b62e373ea3427cabdbf789f2d9d449d51d02e4`.

## [2026-05-24] architecture | Jacob puzzle dependency proposal returned

Jacob wrote a complete 10-room puzzle and item dependency proposal at `jacob-puzzle-dependency-proposal.md`. 40,735 tokens, 6 tool calls.

Design: Sophie climbs from dungeon to castle gate. Ten rooms, two pattern rooms (Library scroll replicated on Chapel altar; Great Hall portraits used to aim Tower telescope). Longest chain spans nine rooms via two threads (key chain and spell chain) meeting at the gate. Difficulty scales from warm-up in Rooms 1–2 to most complex in Room 9 (three items from three rooms). Room 10 finale takes one item each from the three hardest rooms (7, 8, 9).

Tim accepted the proposal (Q114A) as the starting point for v0.2 development. Names, items, and puzzles may still change during build. Recorded as the canonical dependency graph for Sophie's Escape v0.2.

## [2026-05-24] fix | Sean adds GitHub Pages deploy workflow — PR 3 opened

Root cause of the load failure: GitHub Pages was serving the raw source `index.html` (which references `/src/main.js` as an absolute path) rather than the Vite-built `dist/` output (which has the correct base-prefixed path). The `dist/` folder is gitignored and was never deployed.

Sean created PR 3 at `https://github.com/timdixon82/sophies-escape-witchs-castle/pull/3`, branch `chore/github-pages-deployment`, commit `237dfcf`.

Two files changed (no source files touched):
- `.github/workflows/deploy.yml` (new): triggers on push to main and `workflow_dispatch`; runs `npm ci`, `npm run build`, uploads `dist/` as a Pages artifact, deploys to GitHub Pages. All actions pinned to verified commit SHAs.
- `.github/workflows/ci.yml` (updated): replaced placeholder step with real `setup-node`, `npm ci`, `npm run lint`, `npm test`, `npm run build` steps. PHP/WordPress comment blocks removed.

One-time manual step required before merge: Tim must change GitHub Pages source from "Deploy from a branch" to "GitHub Actions" in repo settings (Settings > Pages > Build and deployment > Source).

Tim approved. PR 3 merged to main at commit `210c048`.

Deploy workflow is now on main. Tim changed GitHub Pages source to GitHub Actions. Workflow ran immediately on the merge push, completed in 35 seconds. Live site now serves built assets at `/sophies-escape-witchs-castle/assets/index-C34JE4ez.js`. Game is live at https://projects.timdixon.net/sophies-escape-witchs-castle/.

## [2026-05-24] fix | Sean PR 4 — New Game overlay fix and diagnostics redesign

Root cause identified: `_startNewGame()` in main.js called `mainMenu.close()` directly, bypassing overlay-controller. `_openStack` was never cleared, `OVERLAY_CLOSED` never dispatched, focus never moved — VoiceOver stayed on the closed dialog.

Sean opened PR 4 at https://github.com/timdixon82/sophies-escape-witchs-castle/pull/4, branch `fix/new-game-overlay-and-diagnostics`, commit `e14c3b0`. 68,361 tokens, 39 tool calls.

Three files changed:
- `src/ui/overlay-controller.js`: exported `closeOverlayById(id)` wrapping `_close()`.
- `src/main.js`: imports and uses `closeOverlayById`; adds `game-canvas.focus()` after HUD show; hides diagnostics on clean boot.
- `index.html`: diagnostics redesigned as a 44×44 px toggle button fixed at top-left; panel collapsed by default; separate sr-only `role="alert"` live region for immediate error announcements; panel auto-expands on error; button hidden on clean boot.

All 17 Vitest tests pass. Carol to test.

## [2026-05-24] test | Carol PR 4 — pass (sign off with conditions)

All fixes verified. 83,455 tokens, 42 tool calls — just over 80k ceiling; accepted as substantive.

Fix 1 (New Game): `closeOverlayById` correctly exported, imported, and called. `_close()` removes from `_openStack` and dispatches `OVERLAY_CLOSED`. Canvas focus confirmed (`tabindex="0"`).

Fix 2 (Diagnostics): Three elements correct (diag-live assertive region, 44px diag-toggle, collapsed panel). Click handler toggles `aria-expanded` and `display`. Auto-expands on error. Hides on clean boot. ES5-clean in inline block. diag-toggle contrast 11.1:1 (passes AAA 7:1).

17/17 Vitest tests pass.

Conditions carrying forward (pre-existing, not introduced by PR 4): screen-reader evidence files not on file; SE-001 not yet approved; SE-002 not yet approved; loading bar `aria-valuenow` not updated dynamically.

Merge gate: satisfied. Presenting to Tim for approval.

## [2026-05-24] merge | PR 4 merged to main — commit 6a34fca

Tim approved. PR 4 merged to main. Deploy workflow triggered automatically.

## [2026-05-24] bug | VoiceOver reads loading screen after New Game

Tim reported: popup closes correctly but VoiceOver announces "Sophie's Escape: The Witch's Castle" then "Ready." Game runs (Escape shows pause menu) but VoiceOver lands on wrong content.

Root cause: `#loading-screen` has `role="status"` + `aria-live="polite"`. VoiceOver reads status regions even when `hidden`. Focus returning to `document.body` causes VoiceOver to navigate from page top and find the stale loading screen text.

Fix: `_hideLoadingScreen()` sets `aria-hidden="true"` alongside `hidden`. `_showBootError()` removes `aria-hidden` on re-show. `canvas.focus()` in `_startNewGame()` deferred into `setTimeout(0)` for mobile Safari layout timing.

Sean opened PR 5 at https://github.com/timdixon82/sophies-escape-witchs-castle/pull/5, branch `fix/loading-screen-aria-hidden`, commit `c2d5628`. 50,974 tokens, 32 tool calls. 17/17 tests pass. Carol: Pass (27,778 tokens, 16 tool calls).

Tim clarified: he was looking visually, not using VoiceOver. Sonja identified a second root cause: `#loading-screen { display: flex }` has ID-selector specificity higher than the UA stylesheet's `[hidden] { display: none }`, so the loading screen stays visible despite `hidden=true` being set. Root cause of the New Game visual bug.

Fix: added `[hidden] { display: none !important; }` to the top of `base.css`. Commit `cdedf4f` added to PR 5 branch. Standard practice (cf. normalize.css). No JS change needed — existing `_hideLoadingScreen()` with `hidden=true` now works correctly.

## [2026-05-24] merge | PR 5 merged to main — commit c24432a

Tim approved. PR 5 merged. Deploy workflow triggered. Game at https://projects.timdixon.net/sophies-escape-witchs-castle/ should now show the 3D dungeon cell on New Game.

## [2026-05-27] merge | PR 12 merged — release 0.4.0

Tim approved. Release-please PR 12 (chore(main): release 0.4.0) merged at 14:51 UTC. Included: interaction handler, room manager, puzzle dependency graph, all gameplay fixes from PRs 6–11.

## [2026-05-27] exception | SE-001 and SE-002 filed; no manual screen-reader evidence

Tim approved exceptions SE-001 and SE-002 (Q213A, Q214A).

SE-001 (docs/exceptions/SE-001-3d-navigation.md): 3D first-person navigation cannot meet WCAG 2.2 criterion 2.1.3 (Keyboard No Exception, AAA). Screen-reader support covers UI overlay layer only. The 3D canvas is aria-hidden.

SE-002 (docs/exceptions/SE-002-3d-geometry-colours.md): 3D decorative geometry colours cannot meet WCAG 2.2 criterion 1.4.6 (Contrast Enhanced, AAA). Exception covers decorative geometry only; all overlay text meets AAA contrast.

Tim also directed that manual VoiceOver and JAWS evidence passes are not required for this project. Automated checks (axe-core, Pa11y, WCAG 2.2 AAA code review) are sufficient. Recorded in docs/accessibility.md.

PR 13 (docs/accessibility-exceptions branch) opened with these three file changes.

## [2026-05-27] ci | PR 1 stale checks re-triggered, branch updated, all pass

PR 1 (Dependabot: github/codeql-action 4.35.5 → 4.36.0) had three stale failing checks from 2026-05-23. Re-triggered via API rerun (same checkout, still failed — AppArmor issue). Used PUT /pulls/1/update-branch to sync with current main, which includes pa11y.json. Fresh run passed all 7 checks. Tim approved; merged at 15:02 UTC.

## [2026-05-27] merge | PR 13 merged — exceptions filed, Pa11y workflow fixed

PR 13 merged at 15:22 UTC. Three changes:
- docs/exceptions/SE-001-3d-navigation.md created (Q213A)
- docs/exceptions/SE-002-3d-geometry-colours.md created (Q214A)
- docs/accessibility.md updated: both exceptions marked approved, manual screen-reader evidence not required for this project
- .github/workflows/accessibility.yml: added `npx puppeteer browsers install chrome` step so Pa11y reliably finds Chrome regardless of whether browser-driver-manager downloads fresh or hits cache

## [2026-05-27] ci | PR 13 accessibility Pa11y Chrome issue — fix in progress

PR 13 (docs/accessibility-exceptions) failing Pa11y step with "Could not find Chrome (ver. 148.0.7778.97)". Root cause: browser-driver-manager only sets CHROME_TEST_PATH when it downloads Chrome fresh; when Chrome is cached on the runner it exits immediately without setting the env var. Puppeteer then cannot find its bundled Chrome.

First fix (bridge CHROME_TEST_PATH → PUPPETEER_EXECUTABLE_PATH) failed because CHROME_TEST_PATH was empty when cached. Second fix: add explicit `npx puppeteer browsers install chrome` step, which always installs Chrome to ~/.cache/puppeteer where Pa11y reliably finds it.

Cross-cutting lesson: any project using Pa11y 9.x with browser-driver-manager needs the `npx puppeteer browsers install chrome` step. This applies to Poop-Breakout and any future Vite project. Global wiki pattern to be updated once confirmed.

## [2026-05-27] merge | PR 15 merged — loading bar fix + Pa11y/axe Chrome detection fix

Loading bar `aria-valuenow` now updated at 11 points during boot (5%, 10%, 15%, 35%, 45%, 55%, 65%, 80%, 88%, 92%, 100%). Carol's follow-on from the v0.1 backfill resolved.

Pa11y/axe Chrome detection fixed definitively: `find` locates Chrome and ChromeDriver from browser-driver-manager cache regardless of whether env vars were set on fresh download vs cache hit. ChromeDriver passed explicitly to axe via `--chromedriver-path`. All 7 CI checks pass.

Same fix applied to Poop-Breakout (PR 5, merged same session).

## [2026-05-27] status | Work folder set to pending — v0.2 backlog committed

Setup phase complete. v0.2 backlog committed to main at `docs/v0.2-backlog.md`. Covers: graphics review, audio (BBC licence pending), witch cutscene, hints for all rooms, nine remaining rooms, architecture conformance (4 items), security conditions (5 items), lazy loading, rebindable controls. Work folder status set to pending.

## [2026-05-27] chore | Vite upgrade — PR 14 open

13 Dependabot security alerts on main were all Vite dev-server vulnerabilities (and esbuild as a transitive dep). Sean upgraded:
- Vite 5.3.1 → 8.0.14
- Vitest 1.6.1 → 4.1.7

`npm audit` reports 0 vulnerabilities. Lint clean, 28/28 tests pass, build succeeds. No source changes needed. PR 14 open, CI running. Q216A.
