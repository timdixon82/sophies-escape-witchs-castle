# Carol: Screenshot Findings — Work 024

## Screenshots captured

All screenshots are in `.claude/work/024-sewc-visual-and-item-bug/screenshots/`.

### 01-main-menu.png

Shows the main menu overlay on a dark background. The overlay contains the game title "Sophie's Escape: The Witch's Castle", the subtitle "A first-person puzzle adventure", and an orange "New Game" button. Behind the overlay the 3D scene has already rendered and the "Candle stub on a shelf" interaction label is faintly visible in the lower-left. The menu appears correctly structured and readable.

### 02-dungeon-cell.png

Shows the Dungeon Cell room from the player's starting view. Visible elements:

- Two orange box-geometry items on the left side of the screen. The taller box in the upper-left is the Loose stone item. The angled shorter box in the lower-left, labelled "Candle stub on a shelf", is the candle item.
- A large flat black rectangle in the centre: the heavy wooden door.
- The room walls and floor are flat brown with no architectural detail.
- UI chrome: "Dungeon Cell" room label at the top centre, Help and Hint buttons at bottom-left, Pause and Inventory buttons at top-right and bottom-right.

This screenshot confirms the visual design finding: all geometry is basic placeholder boxes rendered with flat colour. No shading variation, no surface texture, and no shape distinction between items, doors, or architectural features.

### 03-item-closeup.png

A canvas-level screenshot showing the same view as 02-dungeon-cell.png. The two orange item boxes are clearly visible. Both are identical amber rectangles; only position and scale distinguish them. This confirms that items and the door all share the same flat-box visual language with no differentiation beyond size.

### 04-item-not-removed-bug.png

Taken immediately after clicking the "Loose stone (Bent spoon underneath)" button in the keyboard interaction list. The 3D scene is identical to 02-dungeon-cell.png: the Loose stone mesh remains fully visible in the upper-left. The item was dispatched to the store (confirmed by screenshot 05), but `rebuildCurrentRoom()` was not called, so the mesh was not removed from the Three.js scene.

### 05-inventory-check.png

Shows the inventory panel open after picking up the Loose stone. The inventory panel lists "Bent spoon", confirming the state dispatch (`PICK_UP_ITEM`) worked correctly. However, through the darkened 3D scene visible behind the panel, the Loose stone orange box can still be seen in the upper-left portion of the scene.

### 06-after-inventory-close.png

Taken after closing the inventory panel. The scene is fully lit again and the Loose stone mesh is still present in the upper-left, unchanged. This is the clearest evidence of the bug: the item is in inventory but its mesh persists in the scene.

## Items-not-removed bug: confirmed

The bug is confirmed on both counts. After picking up the Loose stone:

1. The Loose stone mesh remains in the 3D scene. Comparison of screenshots 02 and 06 shows the scene is pixel-identical in the area where the Loose stone appears.
2. The keyboard interaction list (`#interaction-kbd-list`) was not refreshed. The "Loose stone (Bent spoon underneath)" button remained in the list after pickup.

Root cause verified in source at `/Users/timdixon/Code/Github/sophies-escape-witchs-castle/src/render/interaction-handler.js`, line 253. The `dispatch({ type: 'PICK_UP_ITEM', ... })` call is present but the two follow-up calls — `rebuildCurrentRoom()` and `refreshInteractionList(announce)` — are absent, exactly as described in the brief.

## Additional visual findings

1. All geometry is flat-colour placeholder boxes. Every object — items, the door, walls, and floor — uses BoxGeometry or PlaneGeometry with a single flat material colour. There is no visual distinction between interactive items and structural elements except colour (items are amber orange; the door is black; the walls are brown). This was the expected state and is in scope for Simon's design review.

2. The item label tooltip ("Candle stub on a shelf") is rendered as a text overlay on the 3D canvas. It appears whenever the player faces the candle item. This is functional but the label appears over the item continuously rather than on proximity approach — this may be by design and is noted for Simon's awareness.

3. The main menu backdrop already shows the live 3D scene rendered behind it. The interaction text "Candle stub on a shelf" is faintly legible behind the menu overlay. This is cosmetically minor.

4. One console error was recorded: "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a meta element." This is a CSP configuration note, not a functional error. It does not affect gameplay.

## Server note

The Vite dev server uses `vite-plugin-mkcert` to provide HTTPS. In the headless test environment, the mkcert `-install` step fails because it requires sudo access to the system keychain. The server was started in HTTP mode by setting the `VITEST=true` environment variable, which the vite config uses to skip the mkcert plugin. The server ran on port 5174 with base path `/sophies-escape-witchs-castle/`. All screenshots were captured over HTTP.
