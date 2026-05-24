# Sophie's Escape: The Witch's Castle

Sophie is trapped in an ancient witch's castle. To escape, she explores ten interconnected rooms, collects items, solves puzzles, and pieces together the path to freedom. The witch watches from her crystal ball. There are no lives, no death, no failure states. The game is about exploring, thinking, and escaping.

Designed and built by Tim Dixon and Sophie.

## Status

v0.1 scaffold is live on the `feat/v0.1-scaffold` branch, open as a draft pull request. Tim can run the Vite development server locally and see the Three.js scene initialise with the Dungeon Cell room, the ambient torch light, and all overlay shells (inventory, hints, pause, main menu). Unit tests pass.

The three-D engine is Three.js (see `docs/decisions/001-3d-engine-choice.md`). To run the game locally:

```
npm install
npm run dev
```

Then open `http://localhost:5173/sophies-escape-witchs-castle/` in a browser.

## Target audience

Ages nine and up, family friendly. Estimated play time thirty to sixty minutes.

## Technology

Browser-based, fully client-side. No server, no login, no installation. The game loads in a browser tab and plays from there.

The 3D engine is Three.js, chosen for its smaller bundle size and mobile performance (see `docs/decisions/001-3d-engine-choice.md`). Audio is managed by Howler.js. Audio assets are sourced from CC0 and Creative Commons libraries including freesound.org, Web Audio API procedural synthesis, and potentially the BBC Sound Effects Library; final picks are listed in `CREDITS.md`. The full tech stack is in `docs/coding-standards.md`.

## Accessibility

This game targets the Web Content Accessibility Guidelines (WCAG) 2.2 at AAA conformance.

In practice that means:

- Every action is doable by keyboard alone. No pointer required.
- Every action is doable by touchscreen alone. Both are equally complete, not just "also supported".
- All on-screen text and interactive elements meet at least a 7:1 colour contrast ratio.
- All touch targets are at least 44 by 44 CSS pixels.
- All animations and transitions respect the operating system's reduced-motion preference.
- Every audio event has a visual counterpart, so the game is playable without sound.
- A three-step hint system is always available, with no cost or penalty for using it.
- The witch encounters can be skipped.
- The game can be paused at any moment and resumed from exactly where you left off.

The project's accessibility notes and any documented exceptions are at `docs/accessibility.md`.

## Known accessibility gap and roadmap

The 3D scene is rendered to a WebGL canvas. A screen reader user will hear "Sophie's Escape game view" from the canvas label, but the 3D room navigation is not perceivable by assistive technology.

The chrome — the main menu, inventory panel, hint panel, and pause overlay — is fully accessible. Every overlay meets WCAG 2.2 AAA: full keyboard operation, ARIA dialog structure, announced state changes, and 7:1 minimum contrast throughout.

The following work would make the 3D scene itself meaningful to a screen reader user:

1. An `aria-live` mirror: an off-screen live region that narrates room name on entry, item interactions, hint progress, and witch encounter events, so a screen reader user receives real-time gameplay feedback without depending on the canvas.

2. Event-driven audio cues: distinct sounds for navigation (moving between rooms, reaching a wall), item interaction, and witch encounters, giving real-time feedback through hearing rather than sight.

3. A keyboard-only audio-navigation mode: a mode in which the player navigates by audio tones and spoken room descriptions, removing any dependency on the 3D view and making the core gameplay accessible to a screen reader user.

These items are recorded as exception SE-001 in [docs/accessibility.md](docs/accessibility.md). They are out of scope for the current build.

## How to play

Once the first playable build is live, this section will describe how to load the game and walk through the controls. Until then, the full controls reference is in section 9 of `docs/design-brief.md`.

The short version: W/S to move, A/D to look, E to interact, I for inventory, H for hints, Escape to pause.

## The ten rooms

Sophie moves through ten rooms in the witch's castle:

1. The Dungeon Cell. The starting room. Find your way out.
2. The Stone Corridor. Atmospheric. A hidden item waits.
3. The Kitchen. Cauldron, shelves, an ingredient puzzle.
4. The Library. Books, a locked cabinet, a riddle.
5. The Great Hall. Portraits, a fireplace, a multi-item puzzle.
6. The Chapel. Stained glass, an altar, a symbol puzzle.
7. The Armoury. Chests, a lock and key.
8. The Tower Room. A telescope, a star map, an observational puzzle.
9. The Witch's Study. The most atmospheric room. A complex multi-item puzzle.
10. The Castle Gate. Every previous solution comes together. Escape.

## Licence

Source code: PolyForm Noncommercial 1.0.0. Sophie's Escape is non-commercial; the `LICENSE` file at the repository root carries the full terms. Commercial use requires a separate licence agreement with Tim Dixon.

Audio assets carry their own licences, listed individually in `CREDITS.md`. The BBC Sound Effects Library is one candidate source among several; see `docs/design-brief.md`, section 5, for the full note on audio sourcing.

## Credits

Every dependency, analytics service, and third-party asset — including all audio picks made at the v0.2 audio build — is listed in [CREDITS.md](CREDITS.md) at the repository root. The in-game Credits screen will cross-reference the same file once it is built.

## Project wiki

- `docs/design-brief.md`: the original game design brief (version 1.0, 2026-05-23).
- `docs/requirements.md`: the full requirements specification, derived from the design brief.
- `docs/index.md`: catalogue of every project-wiki page.
- `docs/log.md`: chronological, append-only operations log for the project.
- `docs/glossary.md`: domain terms for this project.
- `docs/accessibility.md`: the project's WCAG 2.2 AAA notes.
- `docs/coding-standards.md`: project-specific coding standards.
- `docs/decisions/`: architecture decision records.
- `docs/exceptions/`: any documented accessibility or security exceptions.
- `docs/patterns/`: project-specific reusable patterns.
