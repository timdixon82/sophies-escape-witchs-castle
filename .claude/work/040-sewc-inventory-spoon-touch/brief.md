# Work folder 040: SEWC inventory redesign, spoon fixes, iPad gesture

**Status:** done
**Triage type:** Small feature + bug fix (type 7)
**Opened:** 2026-06-06

## Issue 1: Inventory — full-screen with item icons

The inventory is currently a right-side sidebar. Change it to a full-screen overlay (like the pause and main-menu dialogs), with each item displayed as a large list entry showing:
- A simple SVG icon representing the item (48 × 48 px)
- The item name (bold)
- The item description (smaller text below)

The overlay should use the same full-screen CSS pattern as `#overlay-pause[open]`: `width: 100%; min-height: 100dvh; margin: 0`. Scroll if items overflow.

Create inline SVG icons in `src/ui/inventory-panel.js` for each item. Use simple geometric shapes and the same colours as the 3D mesh materials. Icon suggestions:

| Item ID | Shape hint | Colour |
|---|---|---|
| bent-spoon | Elongated oval + line (spoon silhouette) | #a8a8a8 (silver) |
| candle-stub | Tall narrow rect with flame oval on top | #f0ead8 (cream) with #ffa040 flame |
| moonflower-petal | Ellipse | #e8eeff (silver-white) |
| oil-soaked-rag | Wavy rectangle | #8b6914 (dark brown) |
| pinch-of-salt | Small square with dots | #e0e0e0 (white) |
| dried-mushroom | Dome on stem | #8b5e3c (brown) |
| small-iron-key | Key silhouette | #606060 (dark grey) |
| symbol-order-scroll | Rolled scroll rectangle | #d4b483 (parchment) |
| torn-spell-book-page | Torn rectangle | #d4b483 (parchment) |
| armoury-chest-key | Larger key silhouette | #7a6030 (bronze) |
| portrait-clue | Frame rectangle | #8b4513 (wood) |
| chapel-sigil | Circle with inner cross | #9060a0 (purple) |
| iron-gate-key | Large key silhouette | #404040 (iron) |
| brass-star-chart | Circle with star shape | #c8a020 (brass) |
| lit-torch | Flame oval on stick | #ffa040 (orange) |
| charged-binding-crystal | Diamond/crystal shape | #60c0ff (blue) |

Keep the WCAG 2.5.5 44px minimum touch target on the close button.

## Issue 2: Spoon easier to pick up

The bent spoon's raycaster target is `CylinderGeometry(0.012, ...)` — 1.2 cm radius, very difficult to hit with a ray. Add a larger invisible hitbox mesh centred on the spoon group as the interactable target:

```js
const hitbox = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.16, 0.35),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
);
hitbox.userData = { interactable: true, id: 'item-bent-spoon', label, type: 'item', companions: [group] };
group.add(hitbox);
_interactables.push(hitbox);
```

Remove the handle from `_interactables` — the hitbox replaces it as the ray target. The handle mesh remains visible for rendering.

## Issue 3: Spoon visual — lies flat, flatter bowl

The current spoon is two upright cylinders with `rotation.z = 0.4` (bent look). Tim can see multiple sides because it is fully 3D and upright. Make it lie flat on the floor and improve the bowl shape:

- Rotate the whole group so it lies on the floor: `group.rotation.x = -Math.PI / 2`; set `rotation.z = 0.15` for a slight bend
- Flatten the bowl: change bowl to `CylinderGeometry(0.04, 0.025, 0.008, 10)` (much shallower — 8mm deep)
- Adjust bowl offset to lie in the same plane as the handle

The spoon should look like it has been dropped on the floor and is lying flat.

## Issue 4: iPad gesture clarity — tap-to-interact affordance

On touch devices, it is not obvious that you tap an item label to interact. Add:

1. **Persistent touch hint in the interaction zone**: When an interactive item label is visible (i.e. an item is close enough to show its label), add a small "Tap" badge alongside the label text on touch devices. Detect touch capability with `('ontouchstart' in window)`.

2. **First-play toast on touch devices**: On the very first game start on a touch device (check `localStorage.getItem('sewc-touch-hint-shown')`), show a brief toast message at the top of the screen: "Walk towards items and tap their name to pick them up." Dismiss after 4 seconds and set `localStorage.setItem('sewc-touch-hint-shown', '1')`.

## Out of scope

- New inventory sorting or filtering
- Animated 3D renders of items

## Risk and rollback

Low-medium. CSS, HTML, JS changes. Rollback: revert the branch.

## Definition of done

- Inventory opens full-screen on all viewports
- Each item shows its SVG icon, name, and description
- Bent spoon is noticeably easier to target with the raycaster
- Spoon lies flat on the floor; bowl is shallower
- Touch hint toast appears on first play on touch device
- "Tap" badge visible on item labels on touch devices
- All existing tests pass
- Lint: 0 errors
- PR open on branch `feat/sewc-inventory-spoon-touch`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
