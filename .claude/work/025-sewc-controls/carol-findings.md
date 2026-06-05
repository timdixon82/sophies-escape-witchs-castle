# Carol Test Findings — Work Folder 025: First-Person Controls Fix

- Branch: fix/sewc-controls
- Date: 2026-06-01
- Tester: Carol
- PR: 22
- Round: 2 (re-test after DEF-001 fix)

## Overall verdict: READY TO MERGE

All functional requirements pass. Unit test count is 33 (target 33). No blocking defects remain.

## A. Boot

Result: PASS

New Game launched with no error overlay. The Dungeon Cell rendered correctly: door centred, candle stub visible on the left, room label at the top, HUD controls (Help, Pause, Hint, Inventory) all present and interactive. The only console message was a browser warning about the CSP `frame-ancestors` directive in a meta element — not a JavaScript error; pre-existing behaviour unrelated to this change. Screenshot: `01-dungeon-cell.png`.

## B. Rotation — Full 360°

Result: PASS. Unlimited yaw confirmed.

Method: emitted LOOK_DELTA events via the intent bus using a dynamic import of `intent-bus.js`.

- After 15 events × 10° each = 150° right: camera `rotation.y` was -2.618 rad (exactly -150°). Under the old ±80° clamp, rotation would have stopped at -80°. It did not stop.
- After another 21 events × 10° = 210° more (360° total): camera `rotation.y` was -6.283 rad (exactly -360°).
- Screenshot at 150°: `02-rotated-150deg.png` — door is out of frame; rear wall area visible. View is distinctly different from the start.
- Screenshot at 360°: `03-full-360.png` — scene is identical to the starting view, door centred, candle stub on the left. Full loop confirmed.

## C. Strafe

Result: PASS.

Method: dispatched a `keydown` event for key `a` to the window, then read `getHeldIntents()`.

Held-intent set contents after pressing A: `['MOVE_LEFT']`. The previous (broken) value was `LOOK_LEFT`. The fix is in place in `keyboard-bridge.js`.

Camera position after holding A for 500ms at yaw ≈ 0°: X moved to -2.2 (the dungeon-cell half-width boundary). Z remained at ≈ 0. This confirms pure lateral movement with no yaw change and correct boundary clamping.

Screenshot: `04-strafe-left.png` — door and candle stub have shifted to the right of frame; the left wall is prominent. Camera rotation is unchanged.

Keyup A released the intent cleanly.

## D. Stone Corridor Bounds

Result: PASS.

Method: dispatched `ENTER_ROOM` with roomId `stone-corridor` to the game state, called `enterRoom('stone-corridor')` on the room manager, reset camera to origin, then held W for 3 seconds while logging Z position every 200ms.

Observed Z range: 0 to -6.7m.

The camera reached the boundary at Z = -6.7m and stopped there (confirmed by repeated readings in the movement log). Under the old hardcoded limit, movement would have stopped at Z = -2.7m. The per-room bounds table is active and correct for the stone corridor (half-depth 6.7m as specified).

Screenshot: `05-stone-corridor.png` — long blue-grey corridor with Moonflower petal interactive object and two doors visible. Room label reads "Stone Corridor".

## E. Regression

### Forward and backward movement

Result: PASS.

Pressing S moved the camera from Z = 0 to Z = +1.52m in 500ms (backward direction in this coordinate system). W/S movement is unchanged.

### Pitch clamp

Result: PASS.

Emitted 5 LOOK_DELTA events with dy = 90 each (a total of 450° of downward look attempted). Camera pitch after two animation frames: -0.785 rad (-45.0°). The pitch clamp at ±45° is intact and working correctly. Camera did not flip or exceed the limit.

## F. Unit Tests

Result: PASS.

Command: `npm --prefix "/Users/timdixon/Code/Github/sophies-escape-witchs-castle" test`

Output: 2 test files, 33 tests passed, 0 failed. Duration: 283ms.

## DEF-001 Import Path Fix

Result: CONFIRMED FIXED.

The import in `src/render/first-person-controller.js` line 26 is now `import { getCurrentRoomId } from './room-manager.js'` (same-directory relative path). The previous path `'../room-manager.js'` pointed to a non-existent location. The app now boots without error and all 33 unit tests pass, confirming no broken imports remain.

## Sign-off

READY TO MERGE.

All four functional requirements from the brief are met: full 360° yaw rotation confirmed (no clamp), A/D keys emit MOVE_LEFT/MOVE_RIGHT (strafe, not look), per-room bounds active with stone corridor allowing 6.7m depth, forward/backward movement unchanged, and pitch clamp retained at ±45°. DEF-001 is resolved. 33 unit tests pass.
