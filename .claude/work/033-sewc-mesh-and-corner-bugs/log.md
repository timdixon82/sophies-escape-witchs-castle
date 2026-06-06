# Work log: 033-sewc-mesh-and-corner-bugs

## [2026-06-06] Work folder opened

Tim reported: candle wick stays after pickup, spoon mesh stays after use, items in corners not interactive. Sean dispatched.

## [2026-06-06] Sean — fixes complete, PR opened

Branch: `fix/sewc-mesh-and-corner-bugs`
PR: https://github.com/timdixon82/sophies-escape-witchs-castle/pull/34

Bug 1 (ghost geometry): Added `mesh.userData.companions` to six item builder functions. `removeItemMesh` now loops over companions and calls `scene.remove` and `dispose` on each. Confirmed by `removeSpy` tests: candle-stub removes 3 objects (wax + wick + wickLight), bent-spoon removes 2 (handle + group).

Bug 2 (spoon mesh after puzzle use): `_handlePuzzleTarget` now calls `removeItemMesh` for each item in `puzzleDef.consumedItems` after the puzzle is confirmed solved.

Bug 3 (moonflower petal not interactive): Petal moved from `x = -1.9` to `x = -1.7` in `_buildStoneCorridor`. The leftmost edge is now at `x = -1.82`, well clear of the left wall at `x = -2.0`.

Tests: 87 pass (10 new regression tests). Lint: 0 errors. Build: clean.
- [2026-06-06 16:47:27] subagent completed

## [2026-06-06] Merged

Carol signed off. PR #34 merged to main with Tim's approval. Work folder closed.
- [2026-06-06 16:53:13] subagent completed
