# Work folder 043: Remove lower body, realistic hands, extended brightness

**Status:** active
**Triage type:** Small feature (type 7)
**Opened:** 2026-06-06

## Summary

Tim's four-part request:

1. **Remove the lower body (feet, legs, dress, hair)** from the player view entirely.
2. **Make hands more realistic** — replace the two simple forearm cylinders with proper hand geometry (palm + 4 fingers + thumb per hand).
3. **Extend brightness to a higher maximum** — the current slider reaches 2.0×; Tim wants to go higher (extend to 4.0×).
4. **Larger pickup targets** — handled separately in PR #42 (bump 0.14 m → 0.30 m in `_addInteractable`).

Items 1–3 are built here on branch `fix/sewc-no-body-hands-brightness`.

---

## Issue 1: Remove lower body

### Files

**`src/render/player-model.js`**

Remove all bodyGroup code. The function `createSophieModel()` should:
- No longer create a `bodyGroup` (remove body, legs, shoes, hair parts).
- Return only `{ handsGroup }` (no `bodyGroup` key).
- Update the JSDoc accordingly: remove all references to `bodyGroup`.
- Keep all colour constants (they are used by handsGroup parts).

**`src/render/first-person-controller.js`**

Remove all bodyGroup code:
- Remove the `let _bodyGroup = null` module variable.
- Change the `scene` parameter to `_scene` (underscore prefix) since it is no longer used; keep the parameter in the signature so the call in `main.js` still compiles without change.
- Remove `const { handsGroup, bodyGroup } = createSophieModel()` — replace with `const { handsGroup } = createSophieModel()`.
- Remove `_scene.add(_bodyGroup)`.
- In `disposeFirstPersonController`, remove the `_scene.remove(_bodyGroup)` block and `_bodyGroup = null`.
- Remove the `_bodyGroup` sync block from `updateFirstPersonController` (lines 266–274).
- Update all JSDoc comments that mention `bodyGroup` or `scene`.

**`src/render/first-person-controller.test.js`**

Remove tests that reference `bodyGroup`:
- The test "calls scene.add with the bodyGroup" (currently around line 145).
- The entire `describe('bodyGroup world-space sync', …)` block (currently around line 275).
- Remove the `bodyGroup` mock property from the createSophieModel mock (line 48 area).
- The test "removes the bodyGroup from the scene on dispose" (line 266 area).
- Keep all other tests (camera near plane, look delta, collision, etc.).

---

## Issue 2: Realistic hands

### Replace the two cylinder arms in `src/render/player-model.js`

The current handsGroup contains two `CylinderGeometry(0.03, 0.03, 0.25)` meshes. Replace these with two multi-part hand groups.

Each hand group contains **7 parts**:

| Part | Geometry | Colour |
|---|---|---|
| Forearm | `CylinderGeometry(0.025, 0.03, 0.22, 6)` | COLOUR_FLESH |
| Palm | `BoxGeometry(0.09, 0.10, 0.05)` | COLOUR_FLESH |
| Index finger | `BoxGeometry(0.016, 0.065, 0.020)` | COLOUR_FLESH |
| Middle finger | `BoxGeometry(0.016, 0.072, 0.020)` | COLOUR_FLESH |
| Ring finger | `BoxGeometry(0.016, 0.065, 0.020)` | COLOUR_FLESH |
| Pinky | `BoxGeometry(0.013, 0.052, 0.018)` | COLOUR_FLESH |
| Thumb | `BoxGeometry(0.020, 0.052, 0.022)` | COLOUR_FLESH |

**Position layout within each hand group (local y-axis points toward fingertips):**

```
Forearm:       position(0, -0.14, 0)
Palm:          position(0, 0.0, 0)
Index finger:  position(-0.030, 0.097, 0)
Middle finger: position(-0.010, 0.101, 0)
Ring finger:   position( 0.010, 0.098, 0)
Pinky:         position( 0.030, 0.092, 0)
Thumb (left):  position(-0.058, 0.020, 0.010), rotation.z = -0.55
Thumb (right): position( 0.058, 0.020, 0.010), rotation.z = +0.55
```

**Group positions and angles in camera space:**

```
Left hand group:
  position(-0.30, -0.28, -0.38)
  rotation.z = 0.35    — angles arm inward from bottom-left
  rotation.x = -0.10   — slight forward tilt so palm faces viewer

Right hand group:
  position(0.30, -0.28, -0.38)
  rotation.z = -0.35   — mirror of left
  rotation.x = -0.10
```

**Implementation pattern:** Build a helper `_makeHand(side)` where `side` is `'left'` or `'right'`. Create a `THREE.Group`, add all 7 parts to it, and set group position/rotation based on side. Return the group. Call `_makeHand('left')` and `_makeHand('right')` and add both to `handsGroup`.

The result is a low-poly hand: forearm dropping off screen at the bottom, palm visible, four fingers above the palm, thumb angled outward.

**`src/render/player-model.test.js`**

Update tests to match new hand structure:
- Remove all `bodyGroup` tests (approximately 8 tests).
- Update "returns an object with handsGroup and bodyGroup" → "returns an object with handsGroup".
- Update "handsGroup has exactly 2 children" → "handsGroup has exactly 2 children (left hand and right hand groups)".
- Add: "each child of handsGroup is a THREE.Group" (since each hand is a Group).
- Add: "each hand group has 7 children (forearm, palm, 4 fingers, thumb)" — check `handsGroup.children[0].children.length === 7`.
- Add: "all parts in each hand group are flesh coloured #f5c5a3".
- The Three.js mock needs `Group.add()` to track children, which it already does. `Mesh` mock already exists. Keep the existing CylinderGeometry and BoxGeometry mocks.

---

## Issue 3: Extended brightness range

### `index.html`

Change the brightness slider element:
- `min="0.2"` — keep
- `max="2.0"` → `max="4.0"`
- `step="0.1"` — keep

### `src/ui/settings-panel.js`

Two changes:
1. Line 6 JSDoc comment: `- Brightness (slider 0.2–2.0)` → `- Brightness (slider 0.2–4.0)`
2. Line 47: `_readFloat(STORAGE_BRIGHTNESS, 0.8, 0.2, 2.0)` → `_readFloat(STORAGE_BRIGHTNESS, 0.8, 0.2, 4.0)`

### `src/render/room-manager.js`

Update JSDoc only (no functional change — `applyBrightness` already does unclamped multiplication):
- `@param {number} multiplier — value in 0.2–2.0 range` → `value in 0.2–4.0 range`

---

## Out of scope

- Larger pickup targets: handled in PR #42 (change 0.14 m → 0.30 m in `_addInteractable`)
- Room-specific ambient lighting changes
- Hand animation

## Risk and rollback

Low. No game logic changes. Rollback: revert.

## Definition of done

- bodyGroup code removed from player-model.js and first-person-controller.js
- handsGroup has two hand groups, each with 7 parts (forearm, palm, 4 fingers, thumb)
- Brightness slider max is 4.0 in index.html and settings-panel.js
- All tests pass (expect count to decrease by ~8 bodyGroup tests)
- Lint: 0 errors
- PR open on branch `fix/sewc-no-body-hands-brightness`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
