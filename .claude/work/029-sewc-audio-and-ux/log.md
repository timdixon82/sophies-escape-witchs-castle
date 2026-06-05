# Work log: 029-sewc-audio-and-ux

## [2026-06-05] Work folder opened

Tim reported six issues: partition wall collision, brightness too dark, item-use selection mechanic, no sound, no speech, no captions. Work folder opened. Sean dispatched.
- [2026-06-05 19:44:07] subagent completed

## [2026-06-05] Implementation complete — PR opened

All six issues implemented on branch `fix/sewc-audio-and-ux`.

Changes:
- Collision: Great Hall pillars, Chapel columns, Castle Gate pillars, Witch's Study lectern/desk registered via `_addProp()`.
- Brightness: all room ambient intensities raised ~2x; brightness slider (0.2–2.0, default 0.8, `sewc-brightness`); `applyBrightness()` export.
- Item-use mechanic: puzzle targets require `selectedItemIds[0]`; `#selected-item-hud` HUD; Escape deselects before pause.
- Audio: Howler stub replaced with Web Audio API procedural synthesis; footstep distance accumulator; volume slider (`sewc-volume`); deferred AudioContext init.
- Speech: `src/ui/speech-manager.js`; Web Speech API; toggle (`sewc-speech`).
- Captions: `#caption-overlay`; `aria-live="polite"` / `role="status"`; 4-second auto-clear; toggle (`sewc-captions`).

Tests: 78 passing (6 files). Lint: 0 errors. Build: clean.
Accessibility regression suite: S-01 to S-12 checked; all pass or not applicable; S-11 (input borders) noted for Carol's visual pass.

PR: https://github.com/timdixon82/sophies-escape-witchs-castle/pull/29
Status: Active — awaiting Jed security review and Carol test pass.
