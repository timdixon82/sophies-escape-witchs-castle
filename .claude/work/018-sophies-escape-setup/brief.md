# Brief: 018-sophies-escape-setup

## Summary

Adopt the `timdixon82/sophies-escape-witchs-castle` repository. Status: active.

Sophie's Escape: The Witch's Castle is a first-person browser puzzle-adventure game built on Three.js and Vite. Sophie must explore ten interconnected castle rooms, collect items, solve inventory-based puzzles, and escape — all while the witch watches from her crystal ball. No lives, no failure states; the game is designed to be family-friendly and accessible.

PR 2 (`feat/v0.1 scaffold`) is a substantial first build: 50 files, 11,638 additions. It includes a Three.js scene, game state reducer with 17 unit tests, input bridge (keyboard, mouse, touch), four overlay dialogs (main menu, inventory, hint, pause), design tokens, Content Security Policy (CSP), service worker, and GoatCounter analytics. PR 2 is currently in DRAFT state.

PR 1 is a Dependabot CodeQL bump and can be merged at any time.

Live-test approach (Tim's decision, Q103A modified): Tim will test by merging to main rather than running a local HTTPS development server with mkcert. No certificate installation is needed on Mac or iPhone. Tim approves every merge.

- Status: `active`
- Branch: main (setup phase complete; v0.2 work tracked in docs/v0.2-backlog.md)
- Stack: Vite 8.0.14 + Three.js 0.165.0 + Howler.js 2.2.4 (stub) + Vitest 4.1.7
- Local clone: `/Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-witchs-castle` (on feat/v0.1-scaffold)
- Design brief: `/Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-design-brief.md`
- Priority: high (Tim's children are waiting)

## Requirements

No formal requirements existed when the work folder opened. Tad reviews the design brief and PR 2's `docs/requirements.md` during the retroactive backfill and produces the formal requirements record.

## Routing plan

1. Sonja opens this work folder (this step).
2. Four-agent retroactive backfill in parallel: Tad (business analysis, requirements review of PR 2 docs), Jacob (architecture review of the nine ADRs and code structure), Jed (security review — CSP, service worker, input handling, analytics, dependencies), Carol (baseline WCAG 2.2 AAA accessibility audit of PR 2 overlay dialogs, focus management, keyboard navigation, aria-live regions).
3. Sonja consolidates backfill findings and any open questions for Tim.
4. Tim live-tests v0.1 by approving a merge of PR 2 to main.
5. Carol tests PR 2 against her baseline and produces the release checklist.
6. Sonja runs the merge gate and presents to Tim. PR 2 comes off DRAFT status; Sonja merges only on Tim's express approval.
7. PR 1 (Dependabot CodeQL bump) merged.
8. v0.2 development follows.

## Out of scope

- Audio content (BBC Sound Effects Library deferred to v0.2 pending licence confirmation — Tad Decision 5 in the project ADRs).
- Room content beyond the v0.1 Dungeon Cell stub (nine more rooms, GLTF models, deferred to v0.2).
- Witch encounter cutscene UI (deferred to v0.2).
- Hint content per room (deferred to v0.2 pending Tim's direction).
- Rebindable controls (deferred, Decision D7 in the project ADRs).
- Removing `style-src 'unsafe-inline'` from the CSP (deferred, ADR 007 tightening task).
- Per-room lazy loading (deferred, ADR 003 Tier 2 and Tier 3).

## Risk and rollback

Risk 1: PR 2 is a DRAFT. No merge until Tim has approved. The commit-to-main live-test approach means main is briefly at the v0.1 scaffold state; if the scaffold is broken, main is in a broken state until a revert is applied.

Risk 2: Three.js, Vite, and Howler.js introduce a more complex build pipeline than vanilla JS projects in the team. Jed must verify the build output, CSP, and service worker carefully.

Risk 3: The placeholder GoatCounter `count.js` file does not contain the real analytics script. The real file must be downloaded and committed before any analytics pings are expected.

Rollback: PR 2 goes via the merge gate. Sonja merges only on Tim's express approval. If a regression appears after merge, revert the merge commit.

## Definition of done

- [ ] Retroactive backfill complete: Tad requirements review, Jacob architecture review, Jed security review, Carol baseline audit.
- [ ] Any blocking findings from backfill addressed.
- [ ] Tim has live-tested v0.1 and approved it.
- [ ] PR 2 comes off DRAFT status and passes the merge gate.
- [ ] PR 1 (Dependabot CodeQL bump) merged.
- [ ] Carol's test pass and release checklist complete.
- [ ] Real GoatCounter `count.js` file downloaded and committed (before any analytics ping is needed).

## Approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than the main branch
- [x] Open a pull request
- [ ] Comment on a pull request or an issue
- [ ] Create an issue

## Not pre-approved

- Merging to the main branch. This always needs Tim's express approval at the time.
- Publishing to a blog or a social media account.

## Never allowed

The hard deny-list from `CLAUDE.md`.
