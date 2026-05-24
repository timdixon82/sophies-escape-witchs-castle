# ADR 001: Three.js as the 3D engine

## Status

Accepted on 2026-05-23 by Jacob, with Tim's deferral on question Q73.3 option C ("Jacob to choose").

## Context

Sophie's Escape: The Witch's Castle is a first-person browser 3D puzzle adventure. The game ships as a static site on GitHub Pages, runs entirely client-side, and must remain fast and responsive on mid-range mobile devices as well as desktops. The design brief at `docs/design-brief.md` section 13 lists two candidate engines for the 3D layer: Three.js and Babylon.js. The brief writes Three.js first as the suggested default. The team has not built a browser 3D game before, so this is the first decision on a new stack.

Tim deferred the choice to Jacob (Q73.3 option C). The team's standing preference, recorded in the work folder brief, is for lighter and more widely used engines where the project's requirements can be met that way.

The choice has to support every requirement in `docs/requirements.md`:

- A first-person camera in ten distinct rooms (FR-NAV-01, FR-NAV-02, requirements section 16).
- Interactable objects with focus and hover highlights, at WCAG 2.2 AAA focus-visible contrast (FR-NAV-03).
- A frame rate of at least 30 frames per second on a three-year-old mid-range mobile phone, and at least 60 frames per second on a mid-range desktop browser (NFR-PERF-01).
- Load time under five seconds on a typical 4G mobile connection (NFR-PERF-01).
- No server-side component; the engine ships as part of the bundle (NFR-PERF-02).
- A clean separation between the 3D canvas and the HTML user-interface overlay, so the overlay layer can meet WCAG 2.2 AAA in full (NFR-ACC-01, NFR-ACC-02).

## Decision

Use Three.js as the 3D engine for Sophie's Escape.

The engine is pinned to a single exact version in `package.json` and locked in `package-lock.json`. The version pin moves only as part of a deliberate dependency review. Three.js is imported as ECMAScript modules from a local install through the project's build tool (Vite, see ADR 009), tree-shaken at build time so that only the modules the game uses ship to the visitor's browser.

The render layer is isolated behind a thin facade in `src/render/` (see ADR 002). No code outside `src/render/` imports from `three` directly. This keeps the engine swappable in principle, and stops Three.js types leaking into the pure game logic.

## Alternatives considered

### Babylon.js

Babylon.js is the other engine named in the brief. It is a mature, well-supported choice with a more "full game framework" shape than Three.js: a built-in scene inspector, an opinionated scene graph, integrated physics, and a wide collision and animation toolset out of the box.

Rejected for Sophie's Escape on four grounds:

1. Bundle size. The full Babylon.js engine is about 2.5 to 3 megabytes minified (around 700 to 900 kilobytes gzipped). With selective ECMAScript-module imports the working figure can come down to roughly 400 to 600 kilobytes gzipped, but only with careful per-module tree-shaking. Three.js, by contrast, sits at about 600 kilobytes minified (around 150 kilobytes gzipped) for the core, and a typical first-person scene import set lands at 250 to 350 kilobytes gzipped. For a game played on a 4G mobile connection by a child, the lighter engine matters: the difference is roughly two seconds of load on a slow connection.
2. Mobile performance per frame. Both engines run on WebGL 2 and both can sustain 60 frames per second on simple geometry. Three.js has lower per-frame Central Processing Unit overhead on lightweight scenes because Babylon's scene graph and Physically Based Rendering material defaults carry fixed cost that the ten-room castle does not need. The brief calls for atmospheric rendering, not photoreal materials.
3. Surface area the team would need to learn. Babylon's surface area is larger. Three.js is the more compact application programming interface for what Sophie's Escape needs (a first-person camera, room geometry, lighting, raycasting for object interaction). Sean's learning curve is shorter on Three.js.
4. The brief's own first recommendation and the team's standing preference. The brief lists Three.js first, with the note "lightweight, browser-native, excellent mobile support". The team prefers lighter and more common engines where the requirements can be met that way. Both align on Three.js.

The points where Babylon.js would have won are absent from this project: there is no scripted physics, no large explorable terrain, no built-in animation system to anchor against, and no need for a visual scene editor.

### A WebGL framework smaller than Three.js (for example PlayCanvas Engine, regl, or hand-written WebGL)

Rejected. Three.js is already at the lightest practical end of the maintained-and-popular range. Going lighter than Three.js means either rolling significant amounts of code by hand (raycasting, camera controls, asset loading) or adopting a less-supported library, both of which raise project risk far above the small bundle-size saving.

### A 2D-on-3D shortcut (for example a 2.5D effect with simple sprites and a fake first-person camera)

Considered briefly and rejected. The brief is unambiguous about "real-time 3D" and "first-person 3D exploration" (`docs/design-brief.md` sections 3, 4, and 6.1). A 2D shortcut would not meet the brief.

## Consequences

### Positive

- The initial bundle is small enough to meet the five-second 4G load target with headroom (estimate 1 to 2 megabytes total once Howler.js, audio assets, and the game code are added; well within budget).
- Sean has a wide community to lean on: Three.js is by some distance the most documented browser 3D engine, with high-quality tutorials covering exactly the first-person-puzzle-room shape Sophie's Escape needs.
- The engine is well-suited to mobile. The team can target the 30-frames-per-second mobile commitment with simple lit geometry, low-polygon room models, and shadow maps disabled or kept to a small budget.
- The render layer is contained behind the `src/render/` facade (ADR 002), so a future engine swap is possible if Sophie's Escape grows beyond Three.js's comfortable range.

### Negative or to manage

- Three.js does not ship built-in collision handling. The game needs simple collision against room walls so the player cannot walk through stone. The render layer carries a small custom collision check using `THREE.Raycaster` against a known set of "wall" meshes. This is a few dozen lines of code and is recorded in `src/render/collision.js`.
- Three.js does not ship a first-person controller. The render layer carries a custom `FirstPersonController` that combines the engine's `PointerLockControls` for desktop mouse-look, custom touch handlers for mobile drag-look, and a unified keyboard handler. The controller is small (around 200 lines) and is also where the keyboard-look A/D rotation is implemented for WCAG keyboard parity (FR-NAV-02 and Tad's Decision 8 recommendation).
- Three.js upgrades occasionally introduce small breaking changes in non-core packages (for example loaders or the examples folder). Every upgrade is reviewed by hand and tested against the project's regression set.
- The team does not have prior in-house experience with Three.js. Sean's first build sprint will include a short spike to confirm the first-person controller, the collision check, and the asset-loading pattern before the ten rooms are built. This is a tracked risk in the work folder brief, not a blocker.

### Performance plan to meet the frame-rate target

The architecture commits to these per-room budgets so the 30 frames per second mobile target is reachable by construction:

- Geometry per room: under 20,000 triangles, well within the budget of any phone made in the last three years.
- Texture set: at most one 1024-by-1024 atlas per room, plus the global user-interface and skybox textures.
- Lights per room: at most one directional light plus two point or torch lights, with shadow casting on at most one of them.
- Draw calls per frame: budgeted at under 60 per room. Static room geometry is merged into one or two meshes at build time.
- Post-processing: none in the first build. If atmosphere needs more, the team adds a single inexpensive pass with `prefers-reduced-motion` and low-end-device detection in mind.

These figures are recorded so Carol's performance test pass has a known target, and so Sean can spot a budget breach early.

## Cross-references

- `docs/design-brief.md` section 13: the brief's tech stack recommendation.
- `docs/requirements.md` NFR-PERF-01, NFR-PERF-02, NFR-ACC-01, NFR-ACC-02: the requirements the engine choice is judged against.
- `docs/decisions/002-project-structure.md`: the layered split that contains the engine behind the render facade.
- `docs/decisions/003-asset-bundling-and-loading.md`: how Three.js geometry, textures, and audio are loaded.
- The team's global stack page at `docs/stacks/browser-3d-game.md` in the team wiki: the standards that apply to every browser 3D game project the team takes on.
