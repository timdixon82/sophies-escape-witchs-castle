# ADR 007: Content Security Policy

## Status

Accepted on 2026-05-23 by Jacob, with the explicit lesson from ICCC's Q67 (the `'wasm-unsafe-eval'` need) addressed up front.

## Context

The team's standing standards (`docs/coding-standards.md` and `docs/stacks/browser-ai-application.md` in the global wiki, applied through the inheritance pattern) require every project to ship a Content Security Policy. GitHub Pages cannot send custom HyperText Transfer Protocol response headers (Decision 006 of the global wiki: the GitHub Pages security-header exception), so the policy is delivered through a `<meta http-equiv="Content-Security-Policy">` tag in the HTML head.

Sophie's Escape has several specific concerns that shape the policy:

1. The game runs Three.js, which is a JavaScript module bundle with no inline scripts and no `eval`.
2. The game may use WebAssembly for compressed-texture decoding (Three.js's KTX2 loader, the Draco geometry decompressor) or for any future physics or audio module. WebAssembly compilation needs `'wasm-unsafe-eval'` in `script-src` in modern browsers; this is the lesson ICCC learned in question Q67 (the `'wasm-unsafe-eval'` need surfaced only after the policy was first written).
3. The game uses Howler.js, which may create audio blobs through `URL.createObjectURL(blob)` — this requires `blob:` in `media-src` (and `worker-src` if the audio runs in a worker, which Howler does not need but the Web Audio Application Programming Interface can).
4. The game ships GoatCounter analytics (ADR 006), which makes one outbound network call to `https://timdixon82.goatcounter.com/count`. The `count.js` script is self-hosted, so no third-party origin is in `script-src`.
5. The game uses self-hosted fonts, no third-party font services.
6. The game uses a service worker (ADR 008) which lives at the application origin.

The brief commits to no server-side component (NFR-PERF-02), which simplifies `connect-src` to almost nothing: there is no application backend to talk to, only the analytics endpoint.

## Decision

### The initial policy

The HTML head of every page (the main game page; the credits page if separate) carries:

```
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  media-src 'self' blob:;
  connect-src 'self' https://timdixon82.goatcounter.com;
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

(In the file, the content is one line with no newlines; the broken-up form above is for readability in the architecture record.)

### Each directive, explained

`default-src 'self'`: the default source for all fetch types not explicitly listed is the application's own origin. Nothing else loads by default.

`script-src 'self' 'wasm-unsafe-eval'`: JavaScript loads only from the application origin (no third-party scripts at all, because `count.js` is self-hosted). `'wasm-unsafe-eval'` allows WebAssembly compilation, which Three.js's optional loaders need and which the engine may rely on internally for future features. Adding this directive at the start avoids the painful late retrofit ICCC went through (Q67). Without `'wasm-unsafe-eval'`, modern browsers refuse to compile WebAssembly modules and the relevant Three.js loaders silently fail.

`style-src 'self' 'unsafe-inline'`: stylesheets from the application origin, plus inline styles. Inline styles are needed because the game uses dynamic styling for the inventory selection highlight, the focus ring, and the witch-encounter banner. Removing `'unsafe-inline'` is a follow-up tightening once Sean has audited every inline style and either moved it to a CSS file or replaced it with a CSS class toggle. Recorded as a "tighten as Sean builds" task.

`img-src 'self' data: blob:`: images load from the application origin, plus `data:` URIs (used by some loaders for fallback graphics) and `blob:` URIs (used by the export pipeline if a future feature adds a "share your time" image).

`font-src 'self'`: fonts load only from the application origin. No Google Fonts, no Adobe Fonts, no third-party font services. The font files are committed to `public/fonts/`.

`media-src 'self' blob:`: audio and video files load from the application origin, plus `blob:` URIs (Howler.js can use blob URIs for decoded audio in some configurations).

`connect-src 'self' https://timdixon82.goatcounter.com`: outbound fetch requests can go to the application origin (for room geometry, audio, textures, the service worker's own requests) and to the GoatCounter analytics endpoint. Nothing else can be contacted by any script in the page. This is the single strongest defence against a future supply-chain compromise: even if a third-party library were ever introduced and turned hostile, it could not exfiltrate data to anywhere except the team's own GoatCounter.

`worker-src 'self'`: Web Workers and the service worker load from the application origin.

`object-src 'none'`: no `<object>`, `<embed>`, or `<applet>` elements. The game has none and there is no reason to allow any.

`base-uri 'self'`: a malicious script cannot change the document's base URL to redirect relative fetches.

`form-action 'self'`: forms submit only to the application origin. The game has no form submission today; this is a defence in depth.

`frame-ancestors 'none'`: the game cannot be embedded as an iframe on another site. Clickjacking is not possible against the game.

`upgrade-insecure-requests`: any accidental `http://` reference is rewritten to `https://` before the fetch.

### What is deliberately not yet tight

Two directives carry an exception that the team intends to remove in a later tightening pass:

- `script-src 'wasm-unsafe-eval'`: needed today for Three.js's optional loaders. The only browsers that will let the team remove this are ones that move to compile-from-source for WebAssembly modules, which is not the current state of the platform. The exception stays for the foreseeable future and is recorded here so a later reviewer does not remove it without understanding the cost.
- `style-src 'unsafe-inline'`: needed today for the dynamic styles the game uses. Sean's first build sprint audits every inline style and either moves it to a CSS file or replaces it with a class toggle. Once the audit is clean, this exception is removed in a follow-up pull request. The audit is tracked in the project's `log.md`.

### Reporting

The policy does not include `report-uri` or `report-to` in the first build. Adding violation reporting needs a report-receiver endpoint, which the project does not have (no server). A future option is to use a reporting service such as the GoatCounter event endpoint with a fixed event name (`csp-violation`), but this is recorded as a possible follow-up rather than a starting commitment.

### Headers the policy meta tag cannot send

GitHub Pages cannot send the headers `X-Frame-Options` and `Permissions-Policy`. Per Decision 006 in the global wiki, these are recorded as low-risk security exceptions in the project's `docs/exceptions/` folder. The `frame-ancestors 'none'` directive in the policy gives equivalent clickjacking protection to `X-Frame-Options: DENY`. `Permissions-Policy` would deny capabilities the game does not use (camera, microphone, geolocation, payment); the game does not ask for any of these, so the practical risk is small. The exception is recorded for completeness.

`Strict-Transport-Security` is set by GitHub Pages on the platform side.

`X-Content-Type-Options: nosniff` is set by GitHub Pages on the platform side.

`Referrer-Policy` is delivered through a separate `<meta name="referrer" content="strict-origin-when-cross-origin">` tag in the HTML head. This is the per the static stack standard.

## Alternatives considered

### A permissive starter policy, tightened later

Considered seriously. ICCC's review (Q67) recorded the trade: a permissive starter is easier to deploy on day one but leaves a known retrofit task. Sophie's Escape starts with a tight policy because the project is greenfield and the policy can be written with the WebAssembly need known up front, avoiding the late surprise.

The `'unsafe-inline'` on `style-src` is the one place where Sophie's Escape accepts the starter pattern: removing it on day one would require a CSS-only style pass that has not been written. The tightening is tracked as the immediate follow-up.

### No Content Security Policy in the first build

Rejected. The standing standards require a Content Security Policy on every project. ICCC's history confirms that retrofitting one is harder than writing it up front.

### `script-src 'strict-dynamic'`

Considered. `'strict-dynamic'` allows nonced or hashed scripts to load further scripts without explicit allow-listing. It is powerful but adds complexity (every inline script needs a nonce, generated per request, which a static site cannot do cleanly). The team's pattern is the simpler `'self'`-only allow-list.

## Consequences

### Positive

- The game cannot fetch from any third-party origin except the team's GoatCounter endpoint.
- A future supply-chain compromise in any library cannot exfiltrate game state.
- WebAssembly compilation works the first time, with no ICCC-style retrofit.
- The clickjacking-protection commitment (`frame-ancestors 'none'`) is in place.

### Negative or to manage

- The `'unsafe-inline'` on `style-src` is a recorded interim exception. It must close before Sophie's Escape ships its first 1.0 release. Carol's accessibility test pass and Jed's security review both flag this.
- The policy is delivered through a `<meta>` tag, not a header. This means the policy applies only after the page begins parsing; an attacker who could inject a script into the page body before the `<meta>` tag could bypass it. This is the standing GitHub Pages exception and is recorded as such.
- A future feature that needs a third-party fetch (a leaderboard, a community feature) will need an explicit `connect-src` entry, recorded in a new ADR.

## Cross-references

- `docs/decisions/006-analytics.md`: the GoatCounter endpoint allow-listed in `connect-src`.
- `docs/decisions/008-service-worker.md`: the service worker that loads from `'self'` and respects `worker-src`.
- Global wiki Decision 006 (the GitHub Pages security-header exception).
- ICCC ADR 0009 (the predecessor, with the WebAssembly retrofit lesson).
- ICCC question Q67 (`'wasm-unsafe-eval'` retrofit).
