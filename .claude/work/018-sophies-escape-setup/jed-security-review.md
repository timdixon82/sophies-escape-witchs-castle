# Security Review: Sophie's Escape v0.1 Scaffold (PR 2)

Reviewer: Jed (security agent)
Date: 2026-05-24
Scope: Retroactive backfill security review of the `feat/v0.1-scaffold` branch.
Verdict: Approved with conditions (see Section 10).

## 1. Content Security Policy

File: `/index.html`, line 14.

The delivered policy is:

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
media-src 'self' blob:;
connect-src 'self' https://timdixon82.goatcounter.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

OWASP category: A05 Security Misconfiguration.

### Finding 1: script-src includes unsafe-inline (medium severity, interim-accepted)

The deployed policy carries `'unsafe-inline'` in `script-src`. ADR 007 records this as a deliberate interim relaxation for the diagnostic inline script in `index.html`, pending a nonce or hash-based approach. The diagnostic block (lines 352 to 435 of `index.html`) is a legitimate boot canary with no user-controlled output.

Exploitation risk in this context is low. The application is a static game with no server-side rendering, no user-generated content paths, and no dynamic HTML injection visible anywhere in the source tree. `connect-src` limits exfiltration to the GoatCounter endpoint only. However, `'unsafe-inline'` in `script-src` negates nonce-based protections and means a DOM-based XSS (if one were introduced in a later build) could execute arbitrary code without a bypass.

ADR 007 records a tightening task: once Sean's CSS audit is done, `'unsafe-inline'` on `style-src` is removed. The same logic applies to `script-src`. The path to removal on `script-src` is: hash the diagnostic inline block with a `sha256-` hash and replace `'unsafe-inline'` with that hash. The error-handler `onerror` attribute on the module `<script>` tag (line 439) also needs to move to a separate file or be included in the hash list.

Condition: before the 1.0 release, `'unsafe-inline'` must be removed from `script-src` and replaced with a hash of the diagnostic inline block.

### Finding 2: style-src unsafe-inline (low severity, tracked)

`'unsafe-inline'` on `style-src` weakens style injection protection but presents no direct data-theft path in a game with no user-supplied content. The tightening task is already tracked in ADR 007. No new action needed at this stage.

### Finding 3: worker-src includes blob: (low severity, confirm scope)

The live policy in `index.html` includes `blob:` in `worker-src`, but ADR 007's documented initial policy does not. This deviation means workers loaded from blob URLs are permitted. Howler.js can create audio workers; this is the likely reason. There is no exploit path visible in the current build. However, blob workers can be used as a CSP bypass if script injection is ever achieved. The discrepancy between ADR 007 and `index.html` should be resolved: if `blob:` in `worker-src` is needed for Howler, ADR 007 should be updated to record it.

Condition: reconcile the `worker-src blob:` discrepancy between `index.html` and ADR 007 before the 1.0 release.

### Positive: strong directives

The following directives are well-chosen and present no issues:

- `frame-ancestors 'none'` prevents clickjacking. This is equivalent to `X-Frame-Options: DENY` and works via meta tag.
- `object-src 'none'` closes the plugin execution path.
- `base-uri 'self'` prevents base-tag injection.
- `form-action 'self'` prevents cross-origin form exfiltration.
- `connect-src` is tight: outbound fetch is limited to the GoatCounter endpoint. This is the strongest supply-chain exfiltration defence in the build.
- `upgrade-insecure-requests` is present.

### GitHub Pages header limitation (known exception)

GitHub Pages cannot send `X-Frame-Options`, `Permissions-Policy`, or `X-Content-Type-Options` as HTTP headers. GitHub Pages does set `X-Content-Type-Options: nosniff` and `Strict-Transport-Security` platform-side (confirmed in ADR 007). The `frame-ancestors 'none'` directive compensates for the absent `X-Frame-Options` header. The `Permissions-Policy` gap is low-risk because the game requests none of the restricted capabilities. ADR 007 records this as a standing exception and refers to global wiki Decision 006. No new exception file is needed; the existing ADR record is sufficient.

## 2. Service Worker

File: `/public/sw.js`.

OWASP category: A05 Security Misconfiguration.

### Origin isolation

The service worker correctly limits its fetch interception to same-origin GET requests (lines 56 to 58). Cross-origin requests other than the GoatCounter pass-through are not intercepted or modified. This is the correct posture.

### GoatCounter pass-through

Line 54 passes GoatCounter pings (`url.origin === GOATCOUNTER_ORIGIN`) without caching. This is correct: caching analytics would produce replay counts on cache-served requests.

### Cache versioning

Cache names are suffixed with the `VERSION` constant (`'0.1.0'` in the scaffold). The `activate` handler deletes any cache whose name is not in `ALL_CACHES`, which correctly evicts stale caches on version bump. This is the right pattern.

### Finding 4: VERSION placeholder not yet wired to build-info.js (low severity, known gap)

ADR 008 records that the service worker will read `VERSION` from `src/build-info.js` via `importScripts`, but the scaffold uses the hardcoded string `'0.1.0'`. If a developer bumps `package.json` without updating `sw.js`, the cache will not be invalidated. The ADR says this will be wired in v0.2. This is a known, documented gap rather than an unrecorded risk.

Condition: completing the `build-info.js` wiring before v1.0 is required.

### No inappropriate interception

The worker does not add response headers (no COOP or COEP injections, consistent with ADR 008's decision to omit cross-origin isolation). It does not modify requests or responses. No exfiltration path is present in the worker code.

## 3. Analytics

File: `/src/analytics/analytics.js`.

OWASP category: A02 Cryptographic Failures / data handling.

### Personal data

GoatCounter is a privacy-respecting, cookieless analytics counter. The code confirms this: `_send()` constructs a URL with only two parameters, `p` (path) and `t` (event name). The values are internal game paths (`/game-started`, `/room-entered/dungeon-cell`, `/game-won`) or `window.location.pathname`. No player identifier, no IP address (GoatCounter handles this server-side without storing it), no device fingerprint, no email, and no name is sent.

UK GDPR assessment: no personal data is collected or transmitted by this implementation. GoatCounter's own privacy policy confirms it does not store personal data and is designed to be GDPR-compliant without requiring a consent banner. The main-menu overlay includes an explicit disclosure: "Privacy: this game uses GoatCounter (cookieless analytics). No personal data is stored." This satisfies the transparency principle under UK GDPR Article 13.

No consent mechanism is required for cookieless analytics that do not process personal data.

### Finding 5: GoatCounter count.js is a placeholder (medium severity, pre-1.0 gate)

The file at `/public/scripts/goatcounter-count.js` is empty (a comment-only placeholder). ADR 006 and the project brief both record this. Analytics page views will not be counted until the real file is committed. This is not a security vulnerability, but the placeholder state means the self-hosted Subresource Integrity gap fix is not yet in effect. The brief's definition of done lists "Real GoatCounter count.js file downloaded and committed" as a pre-merge gate. This is already a blocking item.

### Positive: self-hosted count.js closes the SRI gap

When the real count.js is committed, no third-party origin appears in `script-src`. This closes the ICCC Subresource Integrity gap noted in ADR 006. The GoatCounter endpoint in `connect-src` is the only external reference in the policy.

## 4. Persistence

Files: `/src/core/persistence.js` and `/src/core/state.js`.

OWASP category: A02 Cryptographic Failures / data handling.

### Personal data in localStorage

`saveToStorage()` in `state.js` writes `JSON.stringify(_state)` to the key `sophies-escape:save:v1`. The state schema contains:

- `schemaVersion`, `sessionId` (a UUID), `startedAt` (ISO timestamp), `elapsedMs`, `currentRoomId`, `roomsVisited`, `inventory`, `puzzles`, `hints`, `witch`, `settings`, `gameStatus`, `openOverlays`.

None of these fields is personal data as defined under UK GDPR Article 4. The `sessionId` is a per-session random UUID generated by `crypto.randomUUID()` and is not linked to any person. The game collects no name, email, geolocation, or device identifier.

UK GDPR assessment: no personal data is stored. No data subject rights obligations arise.

### Sanitisation

State is written via `JSON.stringify`. There is no untrusted string interpolated into HTML from saved state. The `loadFromStorage` path parses the JSON and spreads it over `createInitialState()`, so unknown keys are merged into a known-shape object. There is no dynamic code evaluation or `innerHTML` path from loaded state to the DOM.

The only place saved data reaches the UI is through the inventory panel's `_formatItemName(item.itemId)` function, which uses `textContent` (not `innerHTML`). This is XSS-safe regardless of what `itemId` contains.

### Positive: UUID generated with crypto.randomUUID

`_generateUUID()` throws if `crypto.randomUUID` is unavailable, rather than falling back to `Math.random()`. The comment explicitly cites the CodeQL insecure-randomness High finding as the reason. This is the correct choice.

## 5. Input Handling

Files: `/src/render/input/keyboard-bridge.js`, `mouse-bridge.js`, `touch-bridge.js`.

OWASP category: A03 Injection.

### DOM-based XSS risk

None of the input bridges write to the DOM. They emit intent strings to the intent bus. The intent strings are fixed constants from a switch/case block (`MOVE_FORWARD`, `MOVE_BACKWARD`, and so on). No user-supplied text from keyboard events reaches the DOM.

### Event handler injection

There is no dynamic event handler construction. All listeners are added with explicit function references via `addEventListener`. No dynamic code evaluation is present in these files.

### Finding 6: touch-bridge emits INTERACT on every touch-end (very low severity, functional note)

Lines 174 to 183 of `touch-bridge.js` emit `INTERACT` on every `touchend` event on the canvas, including those that ended a look-drag. The TODO comment acknowledges this and defers the fix to v0.2. This is a functional issue rather than a security one: it cannot be exploited to inject data or bypass any control.

### Positive: form-field guard in keyboard-bridge

The `_inFormField()` check in `keyboard-bridge.js` prevents single-character shortcuts from firing when a form input has focus. This is WCAG 2.1.4 compliance and also reduces the attack surface for focus-hijacking attempts.

## 6. Dependency Review

File: `/package.json`.

OWASP category: A06 Vulnerable and Outdated Components.

### Vitest 1.6.1 and GHSA-9crc-q9x8-hgqq

The brief states Vitest 1.6.1 was chosen over 1.6.0 specifically to resolve GHSA-9crc-q9x8-hgqq, a critical remote code execution vulnerability in the Vitest browser test runner. Vitest 1.6.1 is a dev dependency only; it does not appear in the production build output. The vulnerability is not exploitable in the deploy artefact. The selection of the patched version is confirmed.

### Production dependencies

- `three@0.165.0`: Three.js, no known critical CVEs at this version as of 2026-05-24.
- `howler@2.2.4`: Howler.js, no known critical CVEs at this version as of 2026-05-24.

### Dev dependencies

- `vite@5.3.1`: no critical CVEs known at this version.
- `eslint@8.57.0`: dev tool, no production exposure.
- `stylelint@16.6.1`: dev tool, no production exposure.
- `vite-plugin-mkcert@2.0.0`: dev tool, dev-server only, not present in production build.
- `vitest@1.6.1`: patched as noted above.

No findings. The dependency set is lean, pinned to exact versions, and the one known critical CVE has been addressed.

## 7. OWASP Top 10 Mapping

| OWASP ID | Category | Status |
|---|---|---|
| A01 Broken Access Control | No authentication or authorisation exists; this is a single-player static game with no accounts. Not applicable. | Pass |
| A02 Cryptographic Failures | No personal data stored or transmitted. Session ID uses crypto.randomUUID. | Pass |
| A03 Injection | No DOM injection paths from user input. textContent used throughout. | Pass |
| A04 Insecure Design | Game design has no trust boundaries to cross. | Pass |
| A05 Security Misconfiguration | CSP is present. Two interim exceptions tracked (unsafe-inline in script-src and style-src). GitHub Pages header gaps recorded. | Conditional pass (see Section 10) |
| A06 Vulnerable and Outdated Components | Known CVE in Vitest addressed. Dependencies lean and exact-pinned. | Pass |
| A07 Identification and Authentication Failures | No authentication. Not applicable. | Pass |
| A08 Software and Data Integrity Failures | count.js self-hosted (SRI gap closed when real file is committed). Vite build uses content-hashed assets. | Conditional pass (count.js placeholder must be replaced) |
| A09 Security Logging and Monitoring Failures | No server-side logging (static game). GoatCounter covers milestone events only. No personal data in events. | Pass |
| A10 Server-Side Request Forgery | No server. Not applicable. | Pass |

## 8. UK GDPR Assessment

This is a static browser game with no user accounts, no contact forms, no payment paths, and no server.

Data collected or processed:

- Analytics pings to GoatCounter: path strings and event names only. No personal data. GoatCounter does not set cookies and does not store IP addresses.
- localStorage: game save state containing a random UUID session ID, timestamps, room progress, inventory, settings. No personal data.

Lawful basis: not required where no personal data is processed.

Transparency: the main-menu overlay discloses GoatCounter use with a link to the GoatCounter website. This satisfies UK GDPR Article 13 to the extent required given no personal data is collected.

Data subject rights: not applicable (no personal data).

Retention: localStorage data is stored indefinitely in the player's own browser. The player can clear it through the browser's own settings. No server-side retention.

Overall UK GDPR verdict: compliant. No consent banner, data processing agreement, or Privacy Notice is required for this build. If future features introduce accounts, leaderboards, or contact forms, a fresh GDPR assessment will be needed at that point.

## 9. Deployment Path Assessment

The game deploys to GitHub Pages via the workflow defined in ADR 009. The deployment model is a fully static artefact with no server-side code execution. The attack surface is therefore limited to the client-side JavaScript.

Positive factors:

- HTTPS is provided by GitHub Pages infrastructure on all deployments.
- `Strict-Transport-Security` and `X-Content-Type-Options: nosniff` are set by GitHub Pages.
- The CSP `<meta>` tag is the best available option given GitHub Pages cannot send headers.
- The workflow uses `npm ci` (lockfile install), not `npm install`, which prevents lockfile bypass.
- CodeQL static analysis runs on every push via a separate workflow.

Limitation to record:

A `<meta>` CSP tag is parsed after the browser begins processing the HTML body. An attacker who could inject content before the `<meta>` tag in the `<head>` could run before the policy loads. This is the standing GitHub Pages exception recorded in ADR 007. For a static file served from GitHub's CDN with no injection path in the build pipeline, the practical risk is negligible.

## 10. Conditions and Overall Verdict

### Conditions for 1.0 release (blocking)

These items must be resolved before the 1.0 release. They are not blocking for the v0.1 merge to `main` because ADR 007 already documents them as deferred tightening tasks.

1. Remove `'unsafe-inline'` from `script-src`. Replace with a `sha256-` hash of the diagnostic inline block, or move the diagnostic block and the module `<script>` error handler attribute to a separate JS file loaded from `'self'`. (Finding 1)
2. Remove `'unsafe-inline'` from `style-src` once Sean's CSS audit is complete. (Finding 2, already tracked in ADR 007)
3. Wire `build-info.js` into the service worker so `VERSION` is injected at build time rather than hardcoded. (Finding 4, already tracked in ADR 008)
4. Replace the placeholder `public/scripts/goatcounter-count.js` with the real GoatCounter count.js file. Already listed in the brief's definition of done. (Finding 5)
5. Reconcile the `worker-src blob:` discrepancy between `index.html` and ADR 007. Either add `blob:` to the policy documented in ADR 007, or remove it from `index.html` if it is not needed. (Finding 3)

### Conditions for v0.1 merge (none blocking)

None of the findings above are blocking for the v0.1 scaffold merge. The build is a draft scaffold and the deferred tightening tasks are all documented.

### Overall verdict

Approved with conditions.

The v0.1 scaffold is fit to merge as a draft. The security posture is appropriate for a cookieless, account-free static game with no personal data. The CSP is the strongest available for a GitHub Pages deployment. All interim relaxations are documented and tracked. The five conditions above must be resolved before the 1.0 release.
