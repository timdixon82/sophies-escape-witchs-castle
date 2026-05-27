# Project Wiki: Operations Log: sophies-escape-witchs-castle

This log is chronological and append-only. It is never edited. Each entry starts with a heading in the form `## [YYYY-MM-DD] <operation> | <subject>`.

## [2026-05-23] ingest | Project wiki created

The project wiki for sophies-escape-witchs-castle was created from the team template.

## [2026-05-25] build | v0.2 game content implemented — branch feat/v0.2, PR 8

Sean implemented v0.2 content across two commits on feat/v0.2:

Commit 3ee0cde (prior dispatch): core v0.2 build.
- src/assets/room-data.js: full v0.2 data — all ten rooms, 16 inventory items, 9 puzzle definitions, one item combination (candle-stub + oil-soaked-rag = lit-torch).
- src/core/reducer.js: new intents USE_ITEM_ON_TARGET, COMBINE_ITEMS, EXAMINE_CLUE, PUZZLE_COMPLETE, GAME_COMPLETE.
- src/render/room-manager.js: Three.js geometry for all 10 rooms with interactable meshes. Each room distinct via wall colours. SE-002 exception applies.
- src/render/interaction-handler.js: Raycaster interaction, door navigation, puzzle triggers, examine clues. Keyboard-accessible button list (WCAG 2.1.1).
- src/main.js, src/ui/hint-panel.js, src/ui/inventory-panel.js: wired for v0.2.

Commit afd102c (this dispatch): tests and rebuildCurrentRoom.
- src/core/reducer.test.js: 11 new Vitest tests for v0.2 intents. 28/28 pass.
- src/render/room-manager.js: rebuildCurrentRoom() added for puzzle-solve geometry refresh.

Build: Vite build passes. ESLint: 0 errors. Tests: 28/28 pass.

Branch notes: The brief specified fix/resize-observer-zero-dimension, but the prior Sean dispatch created feat/v0.2 as the v0.2 content branch. PR 8 is open on feat/v0.2. PR 7 (resize fix) is open on fix/resize-observer-zero-dimension. Both PRs target main.
