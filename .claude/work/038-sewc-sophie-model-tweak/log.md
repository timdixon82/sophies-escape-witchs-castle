# Work log: 038-sewc-sophie-model-tweak

## [2026-06-06] Work folder opened

Tim: Sophie is too much in view. Only feet when looking down, maybe hands when looking forward. Sean dispatched.

## [2026-06-06] Sean complete — PR #38 open

Split model into handsGroup (camera-parented, arms only at screen corners) and bodyGroup (world-parented, follows player position/yaw each frame). No yaw rig exists; bodyGroup attached to scene and updated in updateFirstPersonController(). Body y=-1.35, legs y=-1.65, shoes y=-1.85. PR: https://github.com/timdixon82/sophies-escape-witchs-castle/pull/38. Carol dispatched.

## [2026-06-06] Carol signed off — READY TO MERGE

195 tests pass (8 new). Lint 0 errors. Default view: no dress, faint arms at corners. Look-down 60°: body geometry centred at bottom. Pa11y WCAG2AAA: 0 issues. Merged as PR #38 with Tim's approval.
