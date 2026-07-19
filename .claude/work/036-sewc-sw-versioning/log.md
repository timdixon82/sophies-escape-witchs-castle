# Work log: 036-sewc-sw-versioning

## [2026-06-06] Work folder opened

Hardcoded SW VERSION causes stale cache artefacts after deployment. Sean dispatched to inject build version via Vite plugin.
- [2026-06-06 16:50:02] subagent completed

## [2026-06-06] Carol test complete — PR #35 READY TO MERGE

Carol signed off PR #35 at fix/sewc-sw-versioning:
- 82 tests pass, 0 failures
- Lint: 0 errors on changed file (vite.config.js)
- Build: clean, dist/sw.js contains VERSION = '0.1.0-684c540' (git hash injected)
- public/sw.js unchanged (still has placeholder '0.2.0')
- Pa11y: 0 issues
- axe-core: 0 violations
- Visual: no regression

Pre-existing issues flagged (not blocking): pa11y.json missing WCAG2AAA standard field, mkcert guard fires on vite preview, favicon.svg missing. Tasks recorded.

Awaiting Tim's merge approval.
- [2026-06-06 17:34:45] subagent completed
- [2026-06-06 17:42:41] subagent completed
- [2026-06-06 17:46:30] subagent completed
- [2026-06-06 17:50:01] subagent completed
- [2026-06-06 17:50:07] subagent completed

## [2026-07-19] Housekeeping — folder closed

PR #35 was confirmed merged on GitHub, but this folder was left at
Status: active with its git worktree still checked out. Removed the
stale worktree and set Status: done. No further action needed.
