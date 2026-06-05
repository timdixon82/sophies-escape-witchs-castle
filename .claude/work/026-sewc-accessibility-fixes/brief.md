# Work Folder 026: Accessibility and CI Fixes

- Project: sophies-escape-witchs-castle
- Project-Name: Sophie's Escape — Witch's Castle
- Status: done
- Branch: fix/sewc-accessibility
- Priority: 1
- Blockers: None.

## Summary

Three fixes carried from Carol's test reports on PRs 21 and 22:

1. CI Pa11y/axe job fails on every PR due to ChromeDriver/Chrome version mismatch.
2. No skip link — WCAG 2.4.1 (Bypass Blocks, Level A) requires one.
3. Cell door stays type `puzzle` after the escape is solved, preventing keyboard-only navigation to the Stone Corridor.

## Fix 1 — CI ChromeDriver mismatch

File: `.github/workflows/accessibility.yml`

The workflow already uses `browser-driver-manager` to install a matched Chrome/ChromeDriver pair. The failure is in the axe step: `A11Y_CHROMEDRIVER` may be empty if `find` cannot locate the installed chromedriver, and the axe command does not pass a `--chrome-path` flag so axe may pick up the mismatched system Chrome.

Two changes needed:

A. Broaden the find in the "Set Chrome and ChromeDriver paths" step so it searches the whole runner home rather than a specific subdirectory:

```bash
CHROME=$(find "$HOME" -name "chrome" -not -path "*/chromium*" -type f 2>/dev/null | head -1)
DRIVER=$(find "$HOME" -name "chromedriver" -type f 2>/dev/null | head -1)
echo "A11Y_CHROME=${CHROME:-/usr/bin/google-chrome-stable}" >> "$GITHUB_ENV"
echo "A11Y_CHROMEDRIVER=${DRIVER:-/usr/bin/chromedriver}" >> "$GITHUB_ENV"
```

B. Add `--chrome-path` to the axe step so axe uses the browser-driver-manager Chrome, not the system Chrome:

```yaml
- name: axe-core at WCAG 2.2 AAA
  run: axe "http://localhost:8080/sophies-escape-witchs-castle/" --tags wcag2a,wcag2aa,wcag2aaa,wcag22aa,wcag22aaa --chrome-options="no-sandbox" --chromedriver-path "$A11Y_CHROMEDRIVER" --chrome-path "$A11Y_CHROME"
```

## Fix 2 — Skip link (WCAG 2.4.1)

Files: `index.html` and `src/ui/styles/base.css`

Add a skip link as the very first child of `<body>`, before the loading screen:

```html
<a href="#game-main" class="skip-link">Skip to main content</a>
```

The `<main id="game-main">` target already exists in the HTML.

Add the CSS to `src/ui/styles/base.css` after the `.sr-only` rule:

```css
/* Skip link — visible on keyboard focus, hidden otherwise (WCAG 2.4.1). */
.skip-link {
  position: absolute;
  top: -48px;
  left: 0;
  padding: 10px 18px;
  background: var(--fg-primary, #f0eae0);
  color: var(--bg-canvas, #0a0a0a);
  font: 700 14px/1.4 system-ui, sans-serif;
  text-decoration: none;
  border-radius: 0 0 6px 0;
  z-index: 10000;
  transition: top 0.1s ease;
}
.skip-link:focus {
  top: 0;
}
```

## Fix 3 — Cell door type after puzzle solved

File: `src/render/room-manager.js`

In `_buildDungeonCell()`, the cell door is always created with type `'puzzle'` and id `'room1-door'`:

```js
// Current (always puzzle):
const door = _makeBox(0.9, 1.8, 0.1, 0x1e1a14, [0, 0.9, -D / 2 + 0.05], { roughness: 1.0 });
_addInteractable(door, 'room1-door', 'Heavy wooden door (use bent spoon to open)', 'puzzle');
```

After the cell-escape puzzle is solved, the room is rebuilt but the door is still type `'puzzle'`. The interaction handler's puzzle branch announces "This puzzle is already solved." and returns — no navigation occurs.

Fix: check puzzle state and switch to type `'door'` when solved:

```js
const state = getState();
const cellSolved = state.puzzles['cell-escape']?.state === 'solved';
const cellDoor = _makeBox(0.9, 1.8, 0.1, cellSolved ? 0x2a1e12 : 0x1e1a14, [0, 0.9, -D / 2 + 0.05], { roughness: 1.0 });
_addInteractable(
  cellDoor,
  cellSolved ? 'door-stone-corridor' : 'room1-door',
  cellSolved ? 'Door to Stone Corridor' : 'Heavy wooden door (use bent spoon to open)',
  cellSolved ? 'door' : 'puzzle'
);
```

When `type === 'door'` and `id === 'door-stone-corridor'`, the interaction handler's `_handleDoor` strips the `door-` prefix correctly and dispatches `ENTER_ROOM` with `roomId: 'stone-corridor'`.

## Out of scope

- New game content, rooms, or puzzles.
- Visual geometry changes.
- AgentTeam scripts or global wiki.

## Risk and rollback

- CI workflow: `.github/workflows/accessibility.yml` only. Rollback: revert the two changed lines.
- Skip link: `index.html` (one line added) and `src/ui/styles/base.css` (CSS block added). Rollback: remove both additions.
- Cell door: `src/render/room-manager.js`, `_buildDungeonCell()` only. Rollback: revert the door block.

## Definition of done

- CI accessibility job passes on a PR that has no actual accessibility issues.
- Tabbing to the top of the page reveals a skip link that moves focus to `#game-main`.
- After solving the cell door puzzle, the keyboard-nav list shows "Door to Stone Corridor" as a navigable door button, not a puzzle button.
- 33 unit tests still pass.

## Approved GitHub actions

Carried from Q-SEWC2ABCDEF (2026-05-31): create branch, commit, push branch, open PR, comment on PR/issue, create issue.
