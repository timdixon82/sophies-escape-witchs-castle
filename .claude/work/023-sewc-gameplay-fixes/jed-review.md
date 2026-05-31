# Security Review: PR fix/sewc-gameplay

- Reviewer: Jed (security agent)
- Date: 2026-05-25
- Branch: fix/sewc-gameplay
- Repo: sophies-escape-witchs-castle
- Files reviewed: src/render/interaction-handler.js, src/render/room-manager.js, src/render/engine.js, src/main.js

## Threat model

This is a browser-based static game with no server, no user authentication, and no personal data. The players who reach the game page are treated as the public. The game state lives in the browser only. There is no backend to exfiltrate data to, and there is no privileged session to hijack. The primary risks for this codebase are DOM-based XSS (OWASP A03 Injection) and security misconfiguration of CSP (OWASP A05).

## Verdict

Pass. No blocking security issues found. One informational observation is recorded below.

## Finding 1 — INFORMATIONAL: label text origin (OWASP A03)

The dispatch asked me to confirm that the `label` value written to `labelEl.textContent` in `_makeItemBox` (room-manager.js, line 342) is a static string and not user-supplied.

Trace:

1. `_makeItemBox(pos, id, label)` is called throughout room-manager.js, for example `_makeItemBox([0.6, 0.13, 1.5], 'item-bent-spoon', 'Loose stone (Bent spoon underneath)')` at line 396.
2. Every call site passes a string literal. The label is never taken from URL parameters, localStorage, user input, or an external API. Room and item data originate entirely in `src/assets/room-data.js`, which is a static ES module bundled at build time.
3. The assignment is `labelEl.textContent = label` (line 342), not `innerHTML`, so even if a label somehow contained HTML markup it would be rendered as plain text. There is no unsafe HTML sink in this path.

Conclusion: the DOM injection risk is absent. The label text is developer-controlled, static, and written to `textContent`, not `innerHTML`.

## Finding 2 — INFORMATIONAL: event listeners and teardown

The `tickHighlight` and `updateItemLabels` functions added by this PR do not register event listeners. They are called directly from the game loop. No new `addEventListener` calls are introduced in this PR.

The floating label `div` elements created by `_makeItemBox` are removed in `_tearDownRoom` (lines 187-192): `obj.userData.labelEl.remove()` followed by nulling the reference. The teardown runs on every room transition and on `rebuildCurrentRoom`. This is correct. No orphaned DOM nodes will accumulate across room transitions.

The keyboard-nav list's button click listeners (pre-existing in the codebase) are not affected by this PR.

## Finding 3 — INFORMATIONAL: getRenderer() export (OWASP A03)

`getRenderer()` returns the `THREE.WebGLRenderer` instance. In this codebase the function is called only by `main.js` and passed to `updateItemLabels`. The renderer object exposes methods such as `getSize`, `setSize`, `render`, and access to the underlying WebGL context.

Within a browser-side-only static game:

- There is no server to exfiltrate canvas data to. Any attacker who can execute JavaScript in this context already has full page access.
- The renderer is not exposed to untrusted third-party scripts. The CSP (`script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'`) permits only same-origin scripts. The `'unsafe-inline'` allowance is a tracked interim relaxation noted in the index.html comment, not introduced by this PR.
- `getRenderer()` follows the same pattern as the pre-existing `getCamera()` and `getScene()` exports, which were already in the module boundary.

No additional attack surface is opened that does not already exist via `getCamera()` or `getScene()`.

## Finding 4 — INFORMATIONAL: tickHighlight per-frame and timing side-channels

`tickHighlight` runs every animation frame. It calls `_raycaster.intersectObjects`, which is a CPU-side geometry test. This is standard Three.js usage and does not involve WebGL state queries, GPU timing APIs, or shared resources that a side-channel attacker could measure.

Timing side-channel attacks (such as those using `performance.now()` to infer branch-prediction state) are not a realistic threat in this scenario: the game is single-user, there is no secret to leak through timing, and the computation is entirely deterministic from the scene geometry.

## Finding 5 — INFORMATIONAL: CSP and the new DOM label divs

The new `div` label elements are created by `document.createElement('div')` and styled via `element.style.cssText`. Both operations are standard DOM manipulation. Neither requires changes to the CSP:

- `script-src` is unaffected: no new script elements are created.
- `style-src 'unsafe-inline'` already covers inline style attribute writes. This was a pre-existing tracked relaxation.
- No new external origins are contacted.

The new DOM creation pattern is identical to the pre-existing `_roomLabel` and `_keyboardNavList` element creation already in the codebase. No CSP change is required or recommended as a result of this PR.

## UK GDPR

No personal data is collected, stored, or transmitted by the changed code. UK GDPR does not apply to these changes.

## OWASP Top 10 mapping

| Item | Status |
| A01 Broken Access Control | Not applicable — no access control model |
| A02 Cryptographic Failures | Not applicable — no cryptography |
| A03 Injection (DOM-based XSS) | Reviewed. Label text is static, written to textContent. Safe. |
| A04 Insecure Design | Not applicable |
| A05 Security Misconfiguration (CSP) | Reviewed. No CSP change needed. Existing 'unsafe-inline' is pre-existing, not introduced here. |
| A06 Vulnerable Components | Not in scope for this PR review |
| A07 Authentication Failures | Not applicable — no authentication |
| A08 Software Integrity Failures | Not applicable |
| A09 Logging Failures | Not applicable — no server-side logging |
| A10 SSRF | Not applicable — no server-side component |

## Summary

All five areas identified in the dispatch scope have been reviewed and are clear. The code changes are safe for release.
