# Simon Design Proposal: Visual Improvements for Sophie's Escape

Work folder: 024-sewc-visual-and-item-bug. Author: Simon (designer agent). Date: 2026-05-31.

## Current state summary

The game currently renders every room using the same underlying pattern: six flat planes (floor, ceiling, and four walls) built from `PlaneGeometry` inside `_makeBoxRoom()`, plus a single warm-yellow ceiling point light added identically to every room. All ten rooms share this box. The only difference between rooms is the hex value passed to a single `MeshStandardMaterial`. Items are small 0.25 by 0.25 by 0.25 metre cubes, all shaped identically regardless of what the item is meant to be. Doors are dark flat rectangles with no frame, handle, or depth. Furniture exists in some rooms as additional boxes (shelves, desks, cauldron cylinders), but these are sparse and do not break the "box inside a box" feel.

Here is an honest room-by-room account of what a sighted player sees:

Dungeon Cell: a grey box with one amber cube on the floor and one amber cube on a wall. There is a dark rectangle pressed against the back wall that serves as the door. A second tiny amber box on the wall acts as a torch sconce.

Stone Corridor: a longer grey box with nine dark rectangles pressed into the walls. Two amber cubes float near the walls. Nothing else.

Kitchen: a warm brown box with a single grey cylinder in one corner (the cauldron), one horizontal box for a shelf, and two amber cubes on the shelf. One amber cube floats at roughly waist height on the wall.

Library: a blue-grey box with three stacked dark boxes on the left wall (bookshelves), a flat horizontal box for the desk, and a near-invisible scroll on the desk. A darker box against the back wall is the locked cabinet.

Great Hall: the largest room, a dark-oak-coloured box. Three identical small dark rectangles line the back wall (portraits). The "largest portrait" puzzle object looks exactly like the decorative portraits.

Chapel: a deep indigo box. Six coloured cylinders sit on a rectangular altar box. Coloured point lights (blue and red) cast subtle variation on the walls but have no visible source geometry.

Armoury: an iron-grey box. Three very thin tall boxes pressed against the back wall are weapon racks. An unremarkable dark box in the corner is the chest.

Tower Room: a slate-blue box. A horizontal box and a cylinder stub form the telescope and its stand. Nothing else.

Witch's Study: a deep purple box. A tall thin box is the lectern. A flat box with a small box on top is the desk and plate.

Castle Gate: an aged-stone-coloured box with five thin metal-grey bars across the back wall and three small identical grey boxes as pedestals.

The root cause of Tim's "everything is just blocks" feedback is accurate. The shared `_makeBoxRoom()` pattern uses the same geometry, the same ambient-light intensity formula (with minor per-room variations), and the same ceiling point light in every room. Items are all amber cubes. There is nothing in the geometry or light rigs to communicate the character of a dungeon, a kitchen, a chapel, or a tower.

## Priority improvements

These are ordered from highest visual impact relative to development effort to lowest. Each can be implemented in isolation.

### Improvement 1: Per-room lighting rigs that replace the shared ceiling light

What to change: currently every room adds an identical warm-yellow `PointLight` at position `[0, 2.8, 0]` with intensity 1.5 and distance 12. This produces the same lit-box look in every space. Replace this with a tailored light rig for each room that communicates the room's character.

Which file and function: `src/render/room-manager.js`, each `_build*()` function. The shared warm ceiling light at the top of each function should be removed and replaced with room-specific lights.

Three.js API: `THREE.PointLight`, `THREE.DirectionalLight`, `THREE.SpotLight`. Also adjust `ambientIntensity` in the `_makeBoxRoom()` call for each room to set a different baseline darkness.

Concrete changes per room:

Dungeon Cell: low ambient (0.15). Two torch point lights in amber (`#FFA040`) at the side walls, low to mid-height. A cold seeping-damp blue-grey light at ground level near the door to imply chill from outside.

Stone Corridor: very low ambient (0.1). Alternating amber wall-sconce point lights already exist but can be spaced evenly down the corridor length, giving a rhythm of lit and dark patches. Add a faint cool blue (`#a0b8d0`) ambient to give the sense of stone cold.

Kitchen: medium ambient (0.35). A strong warm-orange fire glow (`#ff6010`) beneath the cauldron position, brighter than current. A warm white `PointLight` over the shelf area to pick out items.

Library: low ambient (0.15). A warm yellow reading-lamp `PointLight` (`#ffe0a0`) at low-medium height over the desk position. Cool blue ambient for the general book-filled space.

Great Hall: very low ambient (0.1). A strong orange-red fireplace glow (`#ff5800`) at the fireplace wall, creating a cone of warm light across the floor. Tiny amber point lights for each portrait position, as if wall candles illuminate them.

Chapel: very low ambient (0.08). The existing blue and red point lights are good but should be made brighter. Add a cold white ambient beam aimed down from above to simulate a skylight. The coloured lights should come from near the side walls rather than the ceiling, suggesting windows.

Armoury: low ambient (0.15). A cold blue-white overhead (`#d0e0ff`, slightly blueish) to evoke a cold stone armoury. Amber torch in one corner only. The metallic rack geometry should pick up the directional quality of a spot.

Tower Room: very low ambient (0.08). Moonlight should be the dominant source: a cool blue-white `DirectionalLight` (`#c0d8ff`) angled from above as if from a window, with a tight-range point light at the telescope position for interest.

Witch's Study: very low ambient (0.08). Purple magic glow already exists but can be strengthened (currently intensity 0.8, raise to 1.2) and positioned at the lectern rather than the ceiling. A second very dim cold amber candle-point at the desk, intensity 0.4, distance 3.

Castle Gate: medium ambient (0.3). The existing daylight glow from the far wall is the right idea; make it significantly brighter (intensity 3.0 instead of 2.0) and widen its reach (distance 14). This creates a clear "light at the end of the tunnel" pull.

Visual improvement relative to effort: very high impact, low effort. Changing number values in existing function calls. No new geometry needed. Lighting alone would make each room immediately feel distinct and atmospheric.

Brand citation: `docs/design-brief.md`, Section 4 — "dark, atmospheric castle aesthetic — stone walls, flickering torches, shadows" and "each room distinct in appearance and feel."

### Improvement 2: Distinctive item shapes instead of identical amber cubes

What to change: every collectible item uses `_makeItemBox()`, which creates a 0.25-metre cube in `TOKEN_ACCENT_AMBER`. Items look identical regardless of whether they are a bent spoon, a candle stub, a moonflower petal, or a key. Replace the shared `_makeItemBox()` with per-item geometry that gives each item a recognisable silhouette.

Which file and function: `src/render/room-manager.js`, the `_makeItemBox()` helper, and each room `_build*()` function where items are placed.

Three.js API: `THREE.BoxGeometry`, `THREE.CylinderGeometry`, `THREE.SphereGeometry`, `THREE.TorusGeometry`. Use `THREE.Group` to composite multi-part items.

Concrete shape mapping:

Bent spoon: a thin elongated box (`0.04, 0.04, 0.35`) in a metallic grey (`#a0a0a0`, metalness 0.8, roughness 0.3) rotated slightly off-axis to look bent. Not amber; it is metal.

Candle stub: a short wide cylinder (`radiusTop 0.04, radiusBottom 0.05, height 0.12`) in off-white (`#f0ead8`), with a tiny amber point light (intensity 0.2, distance 0.5) nested at the wick position to suggest it could be lit.

Moonflower petal: a thin flat disc (use `CylinderGeometry` with `radiusTop 0.15, radiusBottom 0.15, height 0.02, radialSegments 8`) in the existing purple-white tone (`TOKEN_ACCENT_PURPLE`), emissive at 0.6. The flat round shape reads as a petal.

Oil-soaked rag: a roughly square flat box (`0.2, 0.04, 0.16`) in dark brown (`#3a2a1a`, roughness 1.0). No emissive, just dark and cloth-like.

Pinch of salt: a very small white cube (`0.08, 0.08, 0.08`) in near-white (`#e8e8e0`), roughness 0.9 (granular). No emissive.

Dried mushroom: a short cylinder with a wider top (cap) than stem. Use two stacked cylinders: a thin stem (`radiusTop 0.04, radiusBottom 0.04, height 0.08`) under a flat cap (`radiusTop 0.10, radiusBottom 0.06, height 0.05`) in warm brown (`#8a6040`). No emissive.

Small iron key: a thin elongated box (`0.03, 0.03, 0.18`) in iron grey (`#707070`, metalness 0.7, roughness 0.4). Add a small torus (`TorusGeometry` with `radius 0.04, tube 0.015`) at one end as the bow of the key.

Symbol order scroll: a horizontal cylinder (`radiusTop 0.03, radiusBottom 0.03, height 0.3`) in parchment (`#e8d8a0`, roughness 0.7). Rotated so it lies on its side.

Torn spell book page: a flat thin box (`0.3, 0.01, 0.4`) in aged parchment (`#d4c080`, roughness 0.8). Very flat, like a page.

Armoury chest key: same shape as small iron key but slightly larger (`0.04, 0.04, 0.22`) in the same iron grey.

Portrait clue: this is an inventory-only mental note. When it appears in the scene as an examine target, keep the existing purple glow box but make it a flat square (`0.4, 0.4, 0.02`) to suggest a frame or plaque.

Chapel sigil: a flat disc (`CylinderGeometry`, `radiusTop 0.12, radiusBottom 0.12, height 0.04`) in carved stone grey (`#808090`, roughness 0.6), with a faint purple emissive (0.2).

Iron gate key: a heavier version of the key shape, larger (`0.05, 0.05, 0.28`), darker iron (`#505050`, metalness 0.8).

Brass star chart: a flat square plate (`0.25, 0.02, 0.25`) in brass (`#c09030`, metalness 0.7, roughness 0.3) with a faint amber emissive (0.15) to suggest engraving catching the light.

Lit torch: a cylinder shaft (`radiusTop 0.025, radiusBottom 0.03, height 0.4`) in dark wood (`#3a2010`), topped with a small amber box for the flame head, with a `PointLight` of intensity 0.6 and distance 2 at the flame position. This is the most dramatic item visually.

Charged binding crystal: the existing purple box can be changed to a small sphere (`SphereGeometry`, `radius 0.1`) in deep purple-white, emissive purple at 0.8. A sphere reads as a crystal or orb.

The amber highlight-on-hover (`emissiveIntensity` raised to 1.5) will continue to work on any material that has `emissive` set. Items currently without emissive colour will need `emissive: 0xffffff, emissiveIntensity: 0.0` as their base so the highlight function can raise the intensity cleanly. This is a one-line change inside the highlight code in `interaction-handler.js`.

Visual improvement relative to effort: very high impact, medium effort. The silhouettes will make items instantly identifiable and end the "all items look the same" problem. Each item shape is still simple geometry; no new Three.js primitives are needed beyond what is already imported.

Brand citation: `docs/design-brief.md`, Section 4 — "each room distinct in appearance and feel." The brief lists specific items (cauldron, scrolls, keys) that should have visual character.

### Improvement 3: Geometry added to rooms to break up flat walls

What to change: all ten rooms are plain flat-wall boxes. Adding simple geometry (pillars, archways implied by box overhangs, alcoves, ceiling beams, floor-level skirting stones) breaks the box feel without external assets.

Which file and function: `src/render/room-manager.js`, each `_build*()` function.

Three.js API: `THREE.BoxGeometry`, `THREE.CylinderGeometry`, placed as decorative meshes using the existing `_makeBox()` and `_makeCylinder()` helpers. No new functions needed.

Concrete additions per room:

Dungeon Cell: two stone pillars at the front corners of the cell. Use `_makeCylinder(0.18, 0.2, H, 0x5a5550, [-W/2 + 0.2, H/2, D/2 - 0.2])` repeated for the other corner. A horizontal beam box across the ceiling near the door wall to suggest a lintel. Iron bars across the window implied by thin vertical boxes at one wall.

Stone Corridor: low skirting stones along both side walls (`0.1 height, 0.1 deep`) run the length of the corridor. Alternating shallow alcove boxes pressed into the walls (a thin box that matches the wall colour but sits proud by 0.05 metres and is 0.6 wide, 1.0 tall) to house each sconce light. This replaces the floating amber box torches with something that looks mounted.

Kitchen: a pot-rack beam across the ceiling made from a thin horizontal box (`W - 0.5, 0.1, 0.1`) at ceiling height. Three thin vertical box chains hanging from it (`0.03, 0.8, 0.03`). The cauldron already exists as a cylinder, which is good.

Library: two pairs of floor-to-ceiling bookcase columns (boxes, `0.15, H, 0.4`) at the left and right edges of the bookshelf wall. The bookshelves themselves (three stacked dark boxes) can be replaced with five shorter stacked boxes of varied width and height to suggest books of different sizes. A small reading lectern cone beside the desk using `CylinderGeometry` tapered (`radiusTop 0.0, radiusBottom 0.3`) would suggest a decorative stand.

Great Hall: two large square pillars (`0.5, H, 0.5, stonegrey`) placed partway down both side walls to break the empty flanks. A pair of long horizontal banner boxes hanging from near the ceiling on the back wall flanking the portraits, tall thin boxes (`0.4, 2.0, 0.05`).

Chapel: the altar already has cylinder discs, which is good. Add two tall thin columns flanking the altar (`CylinderGeometry`, slightly tapered). A ceiling arch-implication: two quarter-circle shaped overhangs at the front of the chapel created with thin angled boxes.

Armoury: the weapon racks are currently very thin single boxes. Replace each with a pair of horizontal bars and two vertical uprights (four small boxes per rack), making them look like actual weapon-rack frames.

Tower Room: the telescope already has a cylinder stand, which is good. Add a crenelated-feeling window sill: a pair of box shapes at mid-wall height on one wall to suggest a window opening.

Witch's Study: hang three decorative box volumes from the ceiling at varied heights (0.2 by 0.4 by 0.2) in a very dark purple, as if suspended spell components or bundles of herbs. Low ambient purple glow from the lectern area.

Castle Gate: the gate bars already exist. Add two large stone gate-pillar boxes on either side of the bars (`0.5, H, 0.5`) in a slightly lighter stone tone to frame the gate visually.

Visual improvement relative to effort: high impact, medium-high effort. Each room needs individual additions. The benefit is that walls stop being infinite flat planes and start to read as built spaces.

Brand citation: `docs/design-brief.md`, Section 4 — "dark, atmospheric castle aesthetic — stone walls, flickering torches, shadows" and "each room distinct in appearance and feel."

### Improvement 4: Door design with a frame, handle, and depth

What to change: all doors are created by `_makeDoor()` as a 0.9 by 1.8 by 0.1 metre dark box pressed against a wall. There is no frame, no handle, and no indication of depth. The function produces a flat dark rectangle that is difficult to read as a door at all.

Which file and function: `src/render/room-manager.js`, the `_makeDoor()` function.

Three.js API: `THREE.BoxGeometry`, multiple meshes combined into a door group.

What to build:

The door panel itself stays (dark wood, `0x1e1a14`, roughness 1.0). Around it, add four narrow boxes as a door frame: two vertical stiles (`0.1, 1.9, 0.12`) on each side of the panel, and two horizontal rails (`1.1, 0.12, 0.12`) above and below. The frame colour should be a slightly lighter stone or worn wood (`#302820`). At roughly mid-height on the door, add a small handle: a tiny horizontal cylinder (`radiusTop 0.025, radiusBottom 0.025, height 0.15, rotated 90 degrees`) in iron grey (`#707070`, metalness 0.7) offset to one side. The door frame stiles extend slightly proud of the wall plane so they cast a subtle shadow edge.

This change is contained entirely within `_makeDoor()`, which is called from every room builder. The improvement applies to all doors at once.

Visual improvement relative to effort: high impact, low effort. `_makeDoor()` is called once and the change propagates everywhere.

Brand citation: `docs/design-brief.md`, Section 4 — "each room distinct in appearance and feel." A framed door is one of the most basic visual cues that a game world is composed of architectural elements rather than geometry placeholders.

### Improvement 5: Scene fog per room

What to change: there is no fog in the scene. Adding `THREE.FogExp2` to the scene when entering each room gives depth, limits the visible extent of the flat back wall, and makes the lighting more atmospheric by revealing fall-off.

Which file and function: `src/render/room-manager.js`, the `_buildRoom()` function or each room's `_build*()` function. Also requires access to the scene object.

Three.js API: `scene.fog = new THREE.FogExp2(colour, density)`. The fog colour should match the dominant room tone so the horizon blends into atmosphere rather than cutting hard.

Concrete settings per room:

Dungeon Cell: `FogExp2(0x1a1510, 0.18)`. A warm-dark near-black with slight amber bias. Dense enough to lose the far wall in shadow.

Stone Corridor: `FogExp2(0x0e0e14, 0.10)`. Cool near-black. The long corridor benefits from fog making the far end disappear into darkness.

Kitchen: `FogExp2(0x1a0e06, 0.12)`. Very dark warm brown-black, fog of cooking smoke.

Library: `FogExp2(0x0a0c12, 0.14)`. Cool very dark blue-black.

Great Hall: `FogExp2(0x100800, 0.08)`. Very sparse so the large room still reads as large. Slight warm undertone from the fireplace.

Chapel: `FogExp2(0x06060e, 0.12)`. Cool near-black with slight blue tint from the stained-glass lights.

Armoury: `FogExp2(0x080808, 0.14)`. Near-neutral very dark.

Tower Room: `FogExp2(0x060810, 0.12)`. Cool dark blue to imply night sky.

Witch's Study: `FogExp2(0x0a0410, 0.16)`. Deep purple-black, denser fog for the most atmospheric room.

Castle Gate: `FogExp2(0x101010, 0.06)`. Very sparse: the gate room should feel more open.

The scene fog must be cleared and re-set on each room transition. This can be done in `_tearDownRoom()` by setting `scene.fog = null` before the new room sets its own.

Visual improvement relative to effort: very high impact, very low effort. `scene.fog` is a single property assignment. The visual difference is immediate and dramatic.

Brand citation: `docs/design-brief.md`, Section 4 — "dark, atmospheric castle aesthetic" and "shadows."

### Improvement 6: Per-room scene background colour

What to change: the scene background is set once in `engine.js` to `TOKEN_BG_CANVAS` (`#0a0a0a`) and never changes. When fog is thin or the room is large, the hard black background is visible and reads as an obvious rendering limit.

Which file and function: `src/render/room-manager.js`, `_buildRoom()` function or the scene access already available via `_scene`.

Three.js API: `scene.background = new THREE.Color(hex)`.

Set the background to match the fog colour in each room so the horizon blends smoothly. For example, the Tower Room's blue-black fog colour (`0x060810`) becomes the scene background. The values mirror the fog colour table above.

Visual improvement relative to effort: very high impact, trivial effort. One line per room, using values already chosen for Improvement 5.

Brand citation: `docs/design-brief.md`, Section 4 — "dark, atmospheric castle aesthetic."

### Improvement 7: Floor and ceiling material variation

What to change: all room surfaces (floor, ceiling, walls) share a single `MeshStandardMaterial` with uniform roughness (0.95) and metalness (0.0). The floor and ceiling have no visual separation from the walls.

Which file and function: `src/render/room-manager.js`, `_makeBoxRoom()`.

Three.js API: `THREE.MeshStandardMaterial`. Change `_makeBoxRoom()` to accept separate material options for floor, ceiling, and walls, rather than one shared material.

Concrete approach: refactor `_makeBoxRoom()` to create three materials instead of one: `wallMat` (current behaviour), `floorMat` (roughness 0.98, slightly darker, same colour shifted by 15% towards black), and `ceilingMat` (roughness 0.9, slightly warmer or cooler depending on room, same colour shifted 10% towards the dominant light colour). Apply each to the corresponding planes.

For rooms with distinctive floors, go further:

Kitchen floor: add a warm terracotta offset to the floor material (`roughness 0.98`). The floor colour can shift from the wall brown to a more orange-red `#6a3a20` to suggest flagstones.

Chapel floor: a cool darker stone `#25253a` for the floor to contrast with the indigo walls.

Tower Room floor: a very dark slate `#1e2430` for the floor, suggesting cold stone at height.

This change is contained in `_makeBoxRoom()`. Each room builder can pass a `floorColor` option to override the default floor material if needed.

Visual improvement relative to effort: medium-high impact, medium effort. Requires refactoring `_makeBoxRoom()` but only one function.

Brand citation: `docs/design-brief.md`, Section 4 — "dark, atmospheric castle aesthetic — stone walls" implies surfaces that look and feel like stone, with texture and variation.

## Accessibility note

None of the proposed changes conflict with WCAG 2.2 AAA.

The SE-002 exception already documents that WCAG 1.4.6 contrast requirements do not apply to the 3D scene geometry and lighting, because the 3D canvas is `aria-hidden` and contains no text. All seven improvements operate entirely inside the `aria-hidden` 3D canvas. None affect the UI overlay layer, the HTML accessibility tree, keyboard navigation, focus management, or `aria-live` announcements.

The hover highlight for items works by raising `emissiveIntensity` from `BASE_INTENSITY` (0.5) to `HIGHLIGHT_INTENSITY` (1.5) in `interaction-handler.js`. The new item shapes proposed in Improvement 2 use a range of colours. For items that have no `emissive` colour set by default (oil-soaked rag, pinch of salt), the highlight code assumes a material with an `emissive` property. A small defensive change is needed: in `_makeBox()` and `_makeCylinder()`, always initialise `emissive: 0xffffff` and `emissiveIntensity: 0.0` as the default, even when no emissive effect is wanted at rest. This allows `tickHighlight()` to raise `emissiveIntensity` to 1.5 on any item without the emissive being the wrong colour. When `emissive` is white and `emissiveIntensity` is raised, the item glows brighter in its own colour, which is a legible and visually consistent highlight regardless of the item's base colour.

The amber highlight therefore remains legible over every new colour. A purple petal glows brighter purple. A grey key glows brighter grey-white. An amber crystal already emits amber. All highlight states produce a clear brightness increase and none of them depend on a specific colour being distinguishable from another.

No new text is added to the 3D scene by any of these changes. The ARIA live regions, keyboard-accessible button lists, and all other accessibility infrastructure are unchanged.

## Implementation order

Sean should implement the improvements in this sequence. Each step is independent of the others except where noted.

1. Improvement 6 (scene background per room). Trivial effort, immediate visual result, enables the fog in step 2 to blend correctly.

2. Improvement 5 (fog per room). Single property per room, dramatic atmospheric effect. Requires step 1 to be in place for the horizon to blend correctly.

3. Improvement 7 (floor and ceiling material variation). Moved up from position 7. The screenshots confirm that the room reads as a featureless blob with no surface differentiation at all. This is a more urgent readability problem than it appeared from the code alone. See the update section below for the full reasoning.

4. Improvement 4 (door design). Change to one function (`_makeDoor()`), applies to all ten rooms at once. No dependency on steps 1, 2, or 3 but benefits from the atmospheric context they set. Moved to position 4 because the screenshots confirm the door is nearly unreadable as a three-dimensional architectural element.

5. Improvement 1 (per-room lighting rigs). Replace the shared ceiling light in each room's build function. This is the single biggest atmospheric gain but requires editing each room individually. The fog and background from steps 1 and 2 will make the lighting more dramatic by providing a dark horizon for the lights to contrast against.

6. Improvement 2 (distinctive item shapes). Requires one defensive code change in `interaction-handler.js` (initialise `emissive` on all materials) before Sean changes item geometry. Then implement shape by shape. The petal, the torch, and the crystal have the most visual impact and should come first within this step. Sizing notes have been revised in the update section below.

7. Improvement 3 (room geometry additions). These are the most labour-intensive changes and should be done room by room in order of narrative importance: Dungeon Cell, Chapel, Great Hall, Witch's Study, Castle Gate, then the remaining rooms.

## Update after screenshot review

This section records the changes and additions made after Carol's screenshots of the running Dungeon Cell were reviewed. The screenshots show what the code-only analysis could not: actual pixel-level appearance from the player's eye position and Three.js perspective projection.

### Priority order revision

The most significant change is that Improvement 7 (floor and ceiling material variation) has moved from last to third in the implementation sequence.

From the code, Improvement 7 looked like a refinement: a way to add visual polish once the lighting and fog were in place. The screenshots show it is a readability problem. The Dungeon Cell renders as a uniform warm-brown gradient that fills the entire canvas from top to bottom and edge to edge. There is no visible floor edge, no visible ceiling edge, and no visible wall corners. The floor and the walls and the ceiling are indistinguishable. A player who walks into this room cannot orient themselves; there are no horizontal or vertical landmarks. All five surfaces currently share the same `MeshStandardMaterial` colour value and the same roughness of 0.95. Without any surface differentiation, the room reads as a fog-sphere rather than a built space.

Implementing floor and ceiling differentiation early, in conjunction with fog and background colour, will give the room a ground plane and a sky plane. Those two anchors are what all the other improvements (lighting, geometry, door) rest on visually. A door frame at mid-wall reads better when the player can see a wall. An item shape reads better when the player can see a floor beneath it.

Improvement 4 (door design) has also moved up slightly, from position 3 to position 4. From the screenshots the door is even flatter than expected: it reads as a painted dark rectangle pressed against the brown surface. There is no depth cue, no frame, no handle. A player familiar with 3D games would identify it as a door, but barely. Adding the door frame boxes and handle cylinder, as proposed in the original Improvement 4, is quick and dramatically improves the room's readability.

Brand citation for both priority changes: `docs/design-brief.md`, Section 4 — "each room distinct in appearance and feel" and "dark, atmospheric castle aesthetic — stone walls." Neither a featureless brown blob nor a painted door rectangle meets this brief.

### Lighting rig revision

The proposal's Improvement 1 recommended keeping some ambient light and adding targeted room-specific point lights. The screenshots confirm the current setup produces something worse than expected: a warm-brown gradient with no surface differentiation, no shadows, and no sense of three-dimensional space. The warm-yellow ceiling point light at `[0, 2.8, 0]` with intensity 1.5 appears to be flooding the room evenly from a position too close to the centre, so all walls receive nearly identical illumination.

Two specific changes to the Dungeon Cell lighting values are now warranted:

First, the ambient intensity of 0.15 proposed in Improvement 1 may still be too high if it is combined with the current ceiling point light before that light is removed. Sean should remove the existing ceiling point light before adding the torch point lights. If the ambient and the old ceiling light overlap even briefly, the room will remain flat.

Second, the proposed torch point lights at intensity 1.5 and distance 8 should be sufficient to create visible pools of warm light on the near walls. However, because the camera is close to the items and the walls appear uniformly lit in the screenshots, the torch positions should be set at a lower Y value (approximately 1.2 metres from floor, not 2.0 metres) to cast light more across the wall surface than straight down. Lower placement also puts the light closer to where a real wall sconce torch would be, reinforcing the architectural read.

Third, the screenshots confirm there is no difference between the floor and wall illumination. The floor, wall, and ceiling are all receiving the same amount of warm light. The cold seeping-damp blue-grey ground-level light proposed for the Dungeon Cell (a PointLight at `[0, 0.1, 0]`, colour `#6080a0`, intensity 0.3, distance 4) should be retained. It differentiates the floor plane visually by giving the floor a cooler cast even before the floor material colour change from Improvement 7 is applied.

No changes to the other nine rooms' lighting values are needed at this time. The Dungeon Cell is the only room visible in the screenshots.

Brand citation: `docs/design-brief.md`, Section 4 — "flickering torches, shadows."

### Item sizing revision

The screenshots reveal that items appear substantially larger on screen than the code suggests. The "Loose stone (Bent spoon underneath)" item at position `[0.6, 0.13, 1.5]` occupies a large fraction of the upper-left quadrant of the screen. This item is a 0.25-metre cube. The camera starts close to it and Three.js perspective projection enlarges nearby objects significantly.

This has two implications for the shapes proposed in Improvement 2.

First, several items proposed at very small dimensions will not read poorly because they are too small in the world. They may read poorly because they are too small relative to nearby items. In a room where the "Loose stone" cube looks large, a 0.03-metre key (`0.03, 0.03, 0.18`) would look like a thin scratch on the floor. It would be nearly invisible unless the player walks directly up to it. The minimum dimension for any item axis should be 0.05 metres, not 0.03 metres.

Second, the largest items in the proposal (the scroll at `height 0.3`, the page at `0.3, 0.01, 0.4`, the iron gate key at `0.05, 0.05, 0.28`) will fill a reasonable screen proportion when the player is at a typical approach distance. These are fine.

Revised minimum sizes for items that were previously too small:

Small iron key: was `0.03, 0.03, 0.18`. Revised to `0.05, 0.05, 0.22`. The torus bow at one end was `radius 0.04, tube 0.015`. Revise the torus to `radius 0.06, tube 0.02` so the bow is proportional and visible.

Bent spoon: was `0.04, 0.04, 0.35`. Revised to `0.06, 0.06, 0.38`. The extra width makes the spoon visible from the approach angle rather than looking like a rod.

Candle stub: the original `radiusTop 0.04, radiusBottom 0.05, height 0.12` is borderline. Given the perspective distortion shown in the screenshots, revise to `radiusTop 0.055, radiusBottom 0.065, height 0.15`. This keeps the candle-stub proportions (short and squat) while being clearly visible at typical distances.

Pinch of salt: was `0.08, 0.08, 0.08`. This is a 0.08-metre cube. From the screenshots, a 0.25-metre cube is already very prominent. A 0.08-metre cube placed on the floor would be roughly a quarter that size, which would be visible but very small. A small size is appropriate for salt, but revise to `0.10, 0.10, 0.10` to ensure it is findable. Add a small local point light near the salt item (intensity 0.15, distance 0.5, colour near-white `#f0f0e0`) to make the small white cube catch the light and draw the eye.

No size changes are needed for the larger items (scroll, page, brass star chart, moonflower petal, lit torch, crystal).

Brand citation for item sizing: `docs/design-brief.md`, Section 6.5 — "no pixel hunting." Items must be findable by a player who is exploring. If a key is nearly invisible from a metre away, that is a form of pixel hunting.

### UI layer observations

The screenshots reveal several things about the HTML overlay layer that are outside the 3D canvas and relevant to Carol and to accessibility review.

First, the floating item labels (DOM `div` elements positioned over the 3D canvas) are legible and clearly readable in the screenshots. "Candle stub on a shelf" is visible and in an appropriate font size. This should be preserved exactly as-is.

Second, the crosshair is a small amber circle at the centre of the canvas. From the screenshots it is visible but borderline in size. The crosshair is a UI element, not a 3D object, so it is not `aria-hidden`. If it is implemented as an absolutely-positioned HTML element with no accessible text, Carol should confirm it has `aria-hidden="true"` applied. A sighted player uses it for aiming; a screen reader user does not need to hear it announced.

Third, the inventory panel shown in Screenshot 05 has "Bent spoon" visible as a collected item. The panel appears to have readable text. Carol should confirm that the inventory list items have proper ARIA roles and that VoiceOver announces the item names correctly when the panel is opened.

Fourth, the room label "Dungeon Cell" is not visible in any of the screenshots. If it exists in the HTML as a heading or status announcement, Carol should verify that it is announced by the screen reader on room entry via an `aria-live` region. If it does not exist, that is a gap: Tim cannot know which room he is in without a text announcement.

These UI observations are not design changes. They are flagged here so Carol can check them in her accessibility pass.

Brand citation for UI legibility: `docs/design-brief.md`, Section 4 — "UI elements (inventory, hints, pause) clean and accessible — high contrast, large tap targets."
