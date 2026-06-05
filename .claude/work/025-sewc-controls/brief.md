# Work Folder 025: First-Person Controls Fix

- Project: sophies-escape-witchs-castle
- Project-Name: Sophie's Escape — Witch's Castle
- Status: done
- Branch: fix/sewc-controls
- Priority: 1
- Blockers: None.

## Summary

Three control bugs reported by Tim:

1. **Rotation clamped**: the player cannot spin all the way around. The yaw is clamped to ±80° (160° total) in `first-person-controller.js` per FR-NAV-02 (vestibular accessibility). This was a deliberate constraint, but it fundamentally breaks the game — players cannot look behind them or explore a full room.

2. **No strafe**: pressing A, D, or the left/right arrow keys turns the player in place (LOOK_LEFT/LOOK_RIGHT) rather than stepping sideways. In a pointer-lock first-person game the mouse handles turning; A/D should strafe.

3. **Room movement boundary hardcoded** (noticed during code review, not reported by Tim): the movement clamp is fixed at 2.3m × 2.7m for every room. The Stone Corridor is 4m × 14m — the player can barely walk down it. Fixing this alongside the reported bugs.

## Root causes

### Bug 1 — `src/render/first-person-controller.js` line 131

```js
_yaw = Math.max(-MAX_HORIZONTAL_RAD, Math.min(MAX_HORIZONTAL_RAD, _yaw));
```

`MAX_HORIZONTAL_RAD = (80 * Math.PI) / 180`. Remove this clamp entirely. Allow full 360° yaw.

Keep the pitch clamp (±45° vertical) — looking up and down beyond 90° causes camera flip and disorientation.

### Bug 2 — `src/render/input/keyboard-bridge.js` lines 117–125

A/D and ArrowLeft/ArrowRight add `LOOK_LEFT`/`LOOK_RIGHT` to the held-intent set. Change these to `MOVE_LEFT`/`MOVE_RIGHT`.

### Bug 2 continued — `src/render/first-person-controller.js` — no strafe maths

Add handling for `MOVE_LEFT`/`MOVE_RIGHT` in `updateFirstPersonController`. The strafe direction in world space is the camera's local X axis: `(Math.cos(_yaw), 0, -Math.sin(_yaw))`. Moving right by `moveX` steps:

```js
const newX = _camera.position.x + Math.cos(_yaw) * moveX * speed;
const newZ = _camera.position.z - Math.sin(_yaw) * moveX * speed;
```

### Bug 3 — `src/render/first-person-controller.js` lines 107–110

Room bounds are hardcoded:
```js
const ROOM_HALF_W = 2.3;
const ROOM_HALF_D = 2.7;
```

Replace with a per-room bounds table keyed by room ID. Requires importing `getCurrentRoomId` from `room-manager.js`. Per-room half-dimensions (wall minus 0.3m body buffer):

| Room | Half-width | Half-depth |
|---|---|---|
| dungeon-cell | 2.2 | 2.7 |
| stone-corridor | 1.7 | 6.7 |
| kitchen | 2.2 | 2.7 |
| library | 2.7 | 3.2 |
| great-hall | 3.7 | 4.7 |
| chapel | 2.7 | 3.7 |
| armoury | 2.7 | 3.2 |
| tower-room | 2.2 | 2.2 |
| witchs-study | 2.2 | 3.2 |
| castle-gate | 2.7 | 2.2 |
| (default) | 2.2 | 2.7 |

## Out of scope

- Changes to any game content, rooms, or puzzles.
- Changes to room-manager.js visual geometry.
- Changes to the UI overlay layer.
- Changes to the global wiki or AgentTeam scripts.

## Risk and rollback

Both files changed are `src/render/first-person-controller.js` and `src/render/input/keyboard-bridge.js`. No state reducer, no HTML, no CSS, and no test files other than controller tests. Rollback: `git checkout -- src/render/first-person-controller.js src/render/input/keyboard-bridge.js`.

The vestibular-accessibility yaw clamp (FR-NAV-02) is deliberately removed on Tim's instruction. This is noted here for the record.

## Definition of done

- Player can rotate freely through a full 360° horizontal arc.
- A/D and left/right arrow keys strafe (step sideways) relative to the camera facing direction.
- Movement bounds match each room's actual dimensions.
- Existing forward/backward movement is unchanged.
- Tests pass.

## Approved GitHub actions

Tim pre-approved all six standard actions (carried from Q-SEWC2ABCDEF, 2026-05-31):

- Create branch `fix/sewc-controls`
- Commit to that branch
- Push that branch to remote (not main)
- Open a pull request against main
- Comment on a pull request or issue
- Create an issue
