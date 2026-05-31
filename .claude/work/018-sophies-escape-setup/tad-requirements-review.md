# Requirements Review: Sophie's Escape: The Witch's Castle — PR 2 Backfill

**Verdict**: pass

**Bottom line**: The PR 2 documentation captures the design brief well. The nine ADRs cover the scaffold decisions in appropriate depth. The open questions from the original requirements document are still live and need Tim's answers before v0.2 development can start.

**Blocking issues**:

1. The BBC Sound Effects Library licence status is unresolved. Audio cannot be sourced or bundled until Tim confirms the licence path. All audio requirements in the docs/requirements.md depend on this. See Section 4 of this review for details.
2. The exact hint wording for all ten puzzles is absent. The requirements note this as Clarification 1 and flag it as a dependency for Sean. See Section 5 of this review.
3. The item dependency graph for the ten rooms is incomplete. Rooms 3, 4, 5, 9, and 10 carry unresolved dependency notes. See Section 5 of this review.

**Open questions**:

- Q-number unset — BBC Sound Effects Library licence: confirm whether the project falls under personal/educational non-commercial use or requires a separate commercial licence from the BBC. (Original: Tad Decision 5 in the project docs.)
- Q-number unset — Save scope (Clarification 4): confirm whether "session" means browser tab lifetime (sessionStorage) or browser window lifetime (localStorage). The current code is written to accept either, but the choice must be made before v0.2.
- Q-number unset — Voiced witch audio: confirm whether the witch encounter lines should be text-only for v0.2 or voiced. Voiced lines require voice acting, recording, and licencing not yet scoped. (Original: Tad Decision 7 in the project docs.)
- Q-number unset — Rebindable controls: confirm whether a settings screen to remap keyboard shortcuts is in scope for v0.2. WCAG 2.2 criterion 2.1.4 requires that single-character shortcuts are configurable. (Original: Tad Decision D7 / design.md.)
- Q-number unset — Witch trigger timer default: confirm the default trigger interval (current recommendation: four minutes for Rooms 1 to 6, three minutes for Rooms 7 to 10). (Original: FR-WITCH-01 TAD CALL in requirements.md.)
- Q-number unset — Display typeface: confirm whether room titles and witch captions use the Georgia serif fallback, a self-hosted display face, or a Google Fonts web load. (Original: Decision D2 in design.md.)
- Q-number unset — Hint wording for all ten puzzles: provide or approve a wording approach for the thirty hints (three per puzzle) before Sean populates the hint data file. (Original: FR-HINT-03 TAD CALL, Clarification 1.)
- Q-number unset — Item dependency graph: approve or specify the puzzle dependency connections for Rooms 3, 4, 5, 9, and 10 so Sean can build the puzzle state machines. (Original: Clarification 3 in requirements.md.)

**Recommended next agent**: Sonja, to consolidate backfill findings with Jacob, Jed, and Carol, then batch the open questions for Tim.

**Work estimate**: 1 interaction.

---

## About this review

This is a retroactive backfill review. PR 2 was built before a formal requirements process ran. This review assesses how well the PR 2 documentation captures the design brief, identifies gaps, and confirms which open questions remain live.

Source documents read:

- Design brief at `/Users/timdixon/Code/AgentTeam/Inputs/sophies-escape-design-brief.md`
- `docs/requirements.md` (780 lines, version 1.0, dated 2026-05-23)
- `docs/glossary.md` (146 lines, version 1.0)
- `docs/design.md` (366 lines, version 1.0)
- `docs/design-system/tokens.md` (280 lines, version 1.0)
- Nine Architecture Decision Records (ADRs): `docs/decisions/001` through `docs/decisions/009`
- Work folder brief and log at `.claude/work/018-sophies-escape-setup/`

---

## 1. Overall verdict on documentation quality

The documentation is thorough and well-structured for a v0.1 scaffold. The requirements document covers all major areas of the brief, uses acceptance criteria written as testable conditions, and marks every interpretive call with a [TAD CALL] tag so Tim can accept or revise at review. The glossary defines terms clearly and links them to requirements. The design specification is detailed and accessibility-first. The nine ADRs cover the scaffold's technical decisions with clear rationale and cross-references.

The documentation exceeds the quality level typical of a first scaffold build. The main gaps are content gaps — hint wording, room puzzle specifics, audio sourcing — that are correctly deferred and flagged rather than left silently incomplete.

One structural gap exists: the `docs/coding-standards.md` file contains only the project template stub. It reads "The project's stack: a static front-end, PHP with MariaDB, or WordPress" and has no Sophie's Escape-specific content. The actual stack is Vite 5.3.1, Three.js 0.165.0, Howler.js 2.2.4, and Vitest 1.6.1. This should be updated as part of the backfill work.

---

## 2. How well the PR 2 docs capture the design brief

This section works through each section of the design brief and notes whether the requirements document captures it fully, partially, or not at all.

### Brief Section 1: Overview

Fully captured. Requirements Section 1 (Scope) records the browser-based, client-side, ten-room, family-friendly game. The WCAG 2.2 AAA commitment is in scope (Section 1.1) and deployment on GitHub Pages is recorded.

### Brief Section 2: Concept Summary

Fully captured. The requirements open with the scope, and the glossary defines the game's key terms (win condition, witch encounter, item dependency, and others). The no-lives, no-failure-state design (FR-FAIL-01) covers the "about solving, exploring, and escaping" framing.

### Brief Section 3: Technical Requirements

Mostly captured. All items are present:

- Three.js engine: captured in ADR 001 with full rationale.
- First-person 3D: FR-NAV-01.
- Mobile and desktop performance: NFR-PERF-01 (five-second load target, 30 and 60 frames-per-second targets).
- Full keyboard support and full touchscreen support: FR-CTRL-01, FR-CTRL-02, NFR-MOB-01.
- Accessibility requirements from the brief are translated into specific acceptance criteria in Section 13 (NFR-ACC-01 to NFR-ACC-03).
- Session-based save: OR-SAVE-01.

One minor gap: the brief says "touch targets of adequate size" without a number. The requirements sensibly apply the WCAG 2.2 AAA figure of 44 by 44 CSS pixels (FR-PAUSE-01 [TAD CALL]). This is the right call and is correctly flagged. Tim should confirm at the morning review.

### Brief Section 4: Visual Style

Captured in the design specification. Simon's design.md and tokens.md translate the brief's "deep stone greys, amber torch light, purple and green magical accents" into verified AAA-compliant design tokens. The storybook-spooky witch style is defined in the glossary and noted as pending Simon's design pass (Decision D3 in design.md). The one pending decision is the main menu visual treatment (Decision D9 in design.md, light versus dark palette entry point).

One gap worth noting: the design brief mentions "witch cutscenes rendered in a stylised, slightly storybook-spooky visual style" (Section 4). The design specification notes this as a pending art-treatment decision (D3: storybook flat illustration, painted/textured illustration, or pure line art). This is correctly deferred and flagged, but it is a v0.2 blocker because the witch encounter cutscene UI itself is deferred to v0.2 per the work folder brief. No blocking concern for PR 2.

### Brief Section 5: Audio Design

Partially captured, and correctly flagged as deferred. The requirements record the ten required sound categories (Section 18) and reference the BBC Sound Effects Library. The audio-manifest approach (ADR 003) provides the right structure for tracking sound files and their licences.

The licence status is the live risk here. The brief assumes the BBC Sound Effects Library can be used, but the glossary entry for the BBC Sound Effects Library correctly notes that "commercial use requires a separate licence from the BBC." The requirement (Section 1.1) lists audio sourcing as in scope, but both ADR 003 and the work folder brief flag that audio is deferred to v0.2 pending the licence confirmation. This is the right call for PR 2. It needs Tim's decision before v0.2 audio work starts.

The Howler.js audio management library is captured in the requirements (FR-AUDIO-03) and ADR 003. Its inclusion in the PR 2 scaffold as a stub is consistent with the deferred audio approach.

### Brief Section 6: Gameplay Mechanics

Fully captured across Requirements Sections 2 through 11. Key items:

- Exploration and navigation: FR-NAV-01 to FR-NAV-04.
- Inventory system: FR-INV-01 to FR-INV-04, with the design specification providing detailed ARIA and focus management for the inventory panel.
- Puzzle types for each room: Section 16 of requirements. Each room has a puzzle type, dependency notes, and ambient audio notes.
- Hint system: FR-HINT-01 to FR-HINT-03.

Room structure gaps are correctly flagged. The brief gives a suggested room list with themes but does not specify the full puzzle design for each room. The requirements record what the brief says and mark the gaps explicitly as TAD CALLs or Clarification items:

- Room 3 (Kitchen): ingredient puzzle dependencies left open as Clarification 3.
- Room 4 (Library): room numbering inconsistency in the brief itself is flagged (Clarification 3). The brief example uses "Room 3" and "Room 6" but the room list places the Library at Room 4 and the Kitchen at Room 3.
- Room 5 (Great Hall): multi-item puzzle specifics left open.
- Room 9 (Witch's Study): complex puzzle specifics left open.
- Room 10 (Castle Gate): final puzzle mechanic left open.

These are content gaps in the design brief, not gaps in the documentation. The documentation is handling them correctly.

One gap the requirements do not explicitly address: the brief says "players can look around each room by dragging (touch) or mouse movement (desktop)" (Section 6.1) but has no keyboard equivalent listed in its controls table (Section 9). The requirements correctly catch this and add keyboard-look (A/D and arrow keys) as a TAD CALL (FR-NAV-02), citing the WCAG 2.2 AAA full-keyboard-navigation commitment. This is the right interpretation.

### Brief Section 7: The Witch Encounter

Fully captured in FR-WITCH-01 to FR-WITCH-03 and the glossary entries for witch encounter, witch trigger, and crystal-ball cutscene. The witch-encounter cutscene is deferred to v0.2, but the trigger logic and state model are implemented in the PR 2 scaffold (ADR 004, game-state model).

The requirements note that the witch encounter cutscene needs a keyboard-accessible skip control (FR-WITCH-02 [TAD CALL]) because WCAG 2.2 Success Criterion 2.2.2 requires a mechanism to pause or stop time-based media. This is the correct call.

One gap: the witch encounter cutscene visual design is deferred, but the design specification (design.md) provides the semantic structure and the aria-live approach for when it is built. This is consistent and complete for a v0.1 scaffold.

### Brief Section 8: Pause and Exit System

Fully captured. FR-PAUSE-01 to FR-PAUSE-04, FR-PAUSE-03 (continue from save), and FR-MENU-01 all directly address the brief. The design specification covers the pause screen layout, button sizing, and ARIA landmark structure.

One open question is noted: FR-PAUSE-02 [TAD CALL] raises whether the witch timer pauses during the pause screen. The ADR 004 game-state model resolves this in favour of pausing (the `OVERLAY_OPENED` action stops the witch timer tick). This is consistent with the recommendation in requirements but should be confirmed with Tim.

### Brief Section 9: Controls Reference

Fully captured in FR-CTRL-01 and FR-CTRL-02. The keyboard additions (A/D/arrow keys for looking) are flagged as TAD CALLs and justified by WCAG. The design specification lists every control in a definition list accessible by screen reader.

### Brief Section 10: Win Condition

Fully captured in FR-WIN-01. The sharing option is flagged as a decision item (Decision 6 in the project docs) because the Web Share API has minor privacy implications. The end screen accessibility is specified in the requirement.

### Brief Section 11: No Lives / No Failure States

Fully captured in FR-FAIL-01.

### Brief Section 12: Out of Scope

Fully captured in Section 1.2 of the requirements. GoatCounter analytics is added as a team standing default, correctly noted as out of scope for the brief but in scope per the team default.

### Brief Section 13: Tech Stack

Captured across ADR 001 (Three.js engine choice), ADR 002 (project structure), ADR 003 (asset bundling), ADR 009 (Vite deployment), and the requirements' non-functional sections. The brief's suggestion of "no build tools required" is overridden by the team's decision to use Vite; this is recorded in ADR 009 with clear rationale (tree-shaking and code-splitting are necessary at this asset weight).

---

## 3. Assessment of the nine ADRs

The ADRs are well-written and cross-referenced. Each follows the standard pattern: context, decision, alternatives considered, and consequences. They cover the scaffold's decisions at the right level of detail.

### ADR 001: Three.js engine choice

Sound decision. The bundle-size and mobile-performance comparison with Babylon.js is clear and credible. The rejection of a 2D shortcut is correct given the brief's explicit "real-time 3D" requirement. The performance budget (20,000 triangles per room, one 1024-by-1024 texture atlas, under 60 draw calls) is specific enough for Carol to test against and for Sean to target.

One note: the ADR references "Tad's Decision 8 recommendation" (the keyboard-look A/D keys). At the time the ADR was written, this decision was recorded in a `tad-decisions-for-tim.md` file referenced repeatedly across the ADRs. That file does not appear in the PR 2 repository under any path I can find. This is a gap. The decisions it records are described inline in the ADRs and requirements, but the consolidated decision log itself is missing. See Section 5 of this review.

### ADR 002: Layered project structure

Sound decision. The five-layer split (core, render, UI, audio, assets) with strict dependency direction is the right architecture for a project of this complexity. The comparison with ICCC confirms the pattern has proved itself in this team. The dependency rules (what each layer may and may not import) are explicit and enforceable.

### ADR 003: Asset bundling and loading

Sound decision. The three-tier loading strategy (critical bundle, first room preload, lazy-loaded remaining rooms) is the right approach for a 4G mobile target with a 15-megabyte total asset budget. The service worker integration with the loading tiers is clear.

One note: ADR 003 references `tad-decisions-for-tim.md` Decision 5 (the BBC licence path) as a dependency for the audio manifest. This dependency is live and blocking.

### ADR 004: Game state model

Sound decision. The single serialisable state tree with a pure reducer is the right shape for a session-save requirement. The action list maps directly to the requirements. The Clarification 4 decision point (tab vs. window lifetime for session storage) is correctly isolated to one place in the code.

The witch trigger timer design (dispatch `WITCH_TIMER_TICK` on each frame, reducer adds delta, fires when threshold crossed) is implementable and testable. The "reset on hint reveal" and "pause during overlays" behaviours are both implemented in the reducer and match the recommendations in the requirements.

### ADR 005: Input model

Sound decision. The three-bridge, one-intent-bus approach cleanly separates device-specific event handling from game logic. The keyboard-look intents address the WCAG keyboard-parity gap. The touch sensitivity note (real-device tuning needed in first build sprint) is appropriately flagged.

The screen-reader application-mode note (Exception SE-001, awaiting Tim's approval) is a genuine accessibility constraint and is handled correctly: it is documented as an exception rather than silently ignored, and the non-3D UI layers carry the accessibility weight.

### ADR 006: GoatCounter analytics

Sound decision. Self-hosting `count.js` to close the Subresource Integrity gap from ICCC is the right move. The three milestone events (game-started, room-entered, game-won) are proportionate. The privacy notice approach (Credits screen plus README) is consistent with UK General Data Protection Regulation cookieless analytics guidance.

One note: ADR 006 states the decision is "conditional on Tim confirming Tad's Decision 2 recommendation (option A: add GoatCounter)". As with the other Tad decisions, the consolidated decision log is missing from the repository. Tim's confirmation of GoatCounter for this project should be recorded once the open questions are answered.

### ADR 007: Content Security Policy

Sound decision. The policy addresses the WebAssembly (WASM) `'wasm-unsafe-eval'` need up front, which avoids the ICCC Q67 retrofit. The `'unsafe-inline'` on `style-src` is correctly flagged as an interim exception with a tracked tightening task.

The `frame-ancestors 'none'` directive provides clickjacking protection equivalent to `X-Frame-Options: DENY`. The known GitHub Pages security-header limitations are documented and the team's standing exceptions process is followed.

### ADR 008: Service worker

Sound decision. The scope is correct: caching only, no cross-origin isolation, because Sophie's Escape does not need `SharedArrayBuffer`. The three cache scopes (core, room, runtime) are sensible. The GoatCounter analytics pass-through without caching is important and correctly implemented.

### ADR 009: Vite deployment

Sound decision. The build-tool choice follows the team's standing default. The GitHub Actions workflow (lint, test, build, deploy) provides the right quality gates. The manual-publish guardrail (Tim's express approval required for merge) is consistent with the team's non-negotiable rules.

One note: the `docs/coding-standards.md` file references the Vite/Three.js stack only through the ADRs and requirements. The project's own coding-standards page still holds the template stub listing "a static front-end, PHP with MariaDB, or WordPress" rather than the actual stack. This should be updated.

---

## 4. Deferred items: are they properly tracked?

The work folder brief and the requirements both track deferred items. This section confirms the tracking status of each.

### Audio licencing (BBC Sound Effects Library)

Tracking status: tracked in the requirements (Section 1.1 notes audio sourcing is in scope; Section 18 records the sound categories and notes the licence decision), in ADR 003 (the audio-manifest structure records licence terms per file), in ADR 006 (cross-references "Tad Decision 5"), and in the work folder brief (Section: Out of scope, first item).

What is missing: the consolidated `tad-decisions-for-tim.md` file that the ADRs reference. The decision itself is unresolved. Tim needs to confirm whether the project is personal/educational non-commercial (free under the BBC terms) or commercial (needs a separate BBC licence). This is the most time-sensitive open item before v0.2 audio work can start.

### Room content and three-dimensional models

Tracking status: tracked in the requirements (Section 16, each room's content noted with outstanding puzzle specifics flagged as TAD CALLs or Clarifications) and in the work folder brief.

The room-puzzle dependency graph (which items from which rooms are needed where) is the key v0.2 planning item. Rooms 3, 4, 5, 9, and 10 have open dependency notes.

### Hint content per room

Tracking status: tracked in FR-HINT-03 (TAD CALL) as Clarification 1. The requirements note that exact hint wording for all ten puzzles is not in the brief. The wording style is specified, and the brief's examples serve as illustrations.

The structure for storing hints is in place (ADR 002, `src/assets/puzzles.json`). The content is not. Tim needs to either supply wording or approve a wording approach before Sean populates the file.

### Witch encounter cutscene

Tracking status: tracked in the work folder brief (Section: Out of scope) and in the design specification (design.md covers the cutscene semantic structure and ARIA approach). The visual art treatment is a pending decision (D3 in design.md). The witch trigger logic is implemented in the PR 2 scaffold.

The design specification provides a complete structural specification for the cutscene (dialog element, assertive aria-live region, skip button, parameterised alt text). The only missing element is the art assets and voice decision. Correctly deferred.

### Rebindable controls

Tracking status: tracked in ADR 005 (the intent bridge design makes rebinding straightforward) and referenced in the design specification as Decision D7. The work folder brief lists it in the out-of-scope section.

The WCAG 2.2 criterion 2.1.4 (Character Key Shortcuts) requires that single-character shortcuts (I, H, E) be either re-mappable, toggleable, or active only when focus is on a particular component. ADR 005 notes that the shortcut fires only when the game canvas has focus, which provides partial mitigation. Full rebinding remains a v0.2 item. This is the right call for v0.1.

---

## 5. Ambiguous or unresolved requirements

### The missing tad-decisions-for-tim.md file

All nine ADRs and the design specification reference a file called `tad-decisions-for-tim.md`. Searches for this file found no match anywhere in the local clone. The ADRs cite it for at least ten specific decisions (Decision 2 through Decision 10 mentioned across the ADRs). The individual decisions are described inline in the requirements and ADRs, but the consolidated log itself is absent from the repository.

This is a documentation gap. The decisions are not lost (they are embedded in the requirements and ADR text), but the consolidated record is missing. Sonja should decide whether to create this file as part of the backfill or treat the inline references as sufficient. My recommendation is to create the file to close the cross-reference gap. This can be a simple list that collects each decision title and links to the ADR or requirements section where it is resolved or flagged.

### Clarification 4: session storage scope

The requirements (OR-SAVE-01) and ADR 004 both note that the storage backend (sessionStorage or localStorage) is waiting on Tim's answer. The code is written to accept either, with the choice in one place. However, the default in ADR 004 is described as sessionStorage (browser tab lifetime). If Tim does not answer before v0.2 save testing, this defaults to tab lifetime, which means a player who closes and reopens the tab loses their save. For a game aimed at children, this may be surprising. Tim's explicit decision is needed.

### Witch trigger default interval

FR-WITCH-01 recommends four minutes for rooms 1 to 6 and three minutes for rooms 7 to 10, with the caveat that Tim should confirm. ADR 004 implements the four-minute and three-minute values. The state model and game loop are built around these defaults. If Tim wants different intervals, the change is a one-line constant in the state model; but the confirmation should be recorded to avoid confusion during v0.2 testing.

### Screen reader exception SE-001

ADR 005 and NFR-ACC-02 both note that full screen-reader navigation of a three-dimensional game world is not achievable at WCAG 2.2 AAA and document this as Exception SE-001, awaiting Tim's approval. This is a genuine accessibility design decision that Tim needs to formally accept before the exception can be filed in `docs/exceptions/`. The exception is correctly scoped: screen-reader support applies to all UI overlays and informational events; only the real-time 3D camera navigation is excepted.

As Tim is severely sight-impaired and uses VoiceOver and JAWS, his approval of this exception is particularly important. The team should confirm with Tim whether he considers the overlay-only screen-reader approach sufficient or whether additional narration of the 3D environment is required.

### Settings scope

FR-PAUSE-04 records settings as volume-only for v1.0, with a TAD CALL noting that other settings (control sensitivity, motion reduction toggle) are logged as Clarification 2. The ADR 004 state model includes a `reducedMotionUserOverride` field, suggesting the designer considered a manual motion toggle. The requirements do not specify what this toggle does in practice.

The operating system's `prefers-reduced-motion` setting is respected automatically (as noted in the requirements and ADRs). Adding a manual override within the game would benefit players whose OS setting does not reflect their in-game preference. Whether this is v0.1 or v0.2 scope needs confirming.

### Inventory item count cap

FR-INV-02 sets a soft upper bound of twenty items, marked as a TAD CALL. ADR 004 notes that the puzzle design (Tim and Jacob's puzzle pass) will determine the actual number, and the state model does not enforce a cap. The inventory grid layout in the design specification (four columns on desktop, three on mobile) will need pagination if item count exceeds the visible cap.

This is low risk for v0.1 (the scaffold has no items implemented yet), but the total item count should be confirmed during the puzzle design pass to avoid a late grid-layout redesign.

### Colour contrast for the Chapel's stained glass

The requirements note (Room 6, Chapel section in Section 16) that the stained-glass windows use colour to distinguish symbols, which may require a WCAG colour contrast exception. The note says Simon and Jed should review.

This is a genuine WCAG 2.2 AAA concern: WCAG 1.4.1 Use of Colour requires that colour is not the only visual means of conveying information. Symbols distinguished only by colour fail this criterion. The design may need patterns, shapes, or labels in addition to colour. This should be flagged to Simon for the Room 6 design pass.

### GoatCounter count.js file

The work folder brief notes (Risk 3) that the placeholder GoatCounter `count.js` file does not contain the real analytics script. The real file must be downloaded and committed before any analytics pings are expected. This is not a requirements gap but a build gap. The brief correctly flags it.

---

## 6. Requirements that align well and represent good practice

To close with balance, these are the areas where the requirements document is particularly strong:

The ARIA live region specifications throughout the requirements and design docs are detailed and correct. The assertive versus polite distinction for witch encounters versus inventory updates is the right call. The `role="dialog"` and `aria-modal="true"` specifications for all overlays follow the WAI-ARIA (Web Accessibility Initiative Accessible Rich Internet Applications) authoring practices correctly.

The vestibular safety requirements (NFR-ACC-03) are specific and reference the team's established vestibular check procedure from the ICCC project. This is good reuse of an established pattern.

The reduced-motion commitments (`prefers-reduced-motion: reduce`) are applied consistently across the requirements, ADRs, and design specification. Every animation is mentioned with its reduced-motion fallback.

The focus management specifications in the design document (inventory, hint panel, pause screen, cutscene) all follow the WAI-ARIA modal dialog focus management pattern correctly: focus moves in on open, traps inside, returns to the trigger element on close.

The error state design (design.md, error overlay section) correctly satisfies WCAG 3.3.6 Error Prevention (All) by never leading to data loss without warning.

The Content Security Policy (ADR 007) is tight from the start. The `'wasm-unsafe-eval'` lesson from ICCC is applied proactively, which is a genuine improvement over the ICCC build history.

---

## 7. Open questions for Tim

These are the decisions Tim needs to make before v0.2 work can start. They are batched here for Sonja to assign Q-numbers and present in the standard format.

Questions are listed in priority order: most blocking first.

1. BBC Sound Effects Library licence: is this project personal/educational non-commercial use, or does it need a commercial licence from the BBC? Blocking audio sourcing and all audio requirements.

2. Session save scope: does "session" mean browser tab lifetime (the save is lost when the tab closes) or browser window lifetime (the save survives a tab close)? Affects whether sessionStorage or localStorage is used.

3. Voiced witch encounter lines: are the witch's dialogue lines text-only for v0.2, or should they be voiced? Voiced lines require voice acting and licencing not yet scoped.

4. Rebindable controls: is a settings screen to remap the single-character keyboard shortcuts (I, H, E) in scope for v0.2? WCAG 2.2 criterion 2.1.4 applies.

5. Witch trigger timing: confirm four minutes for rooms 1 to 6 and three minutes for rooms 7 to 10, or adjust.

6. Screen reader exception SE-001: do you formally accept that real-time first-person camera navigation cannot meet WCAG 2.2 AAA screen-reader parity, and that screen-reader support will cover only the UI overlay layer? Given your own VoiceOver and JAWS use, your explicit approval of this exception is important.

7. Display typeface: Georgia serif fallback, a self-hosted display face (such as Cinzel or UnifrakturMaguntia), or Google Fonts web load for witch captions and room titles?

8. Hint wording: will you supply wording for the thirty hints (three per puzzle across ten puzzles), or should the team draft the wording for your review?

9. Item dependency graph: will you and Jacob specify which items in which rooms are needed to solve which puzzles in which other rooms?

---

*Review by Tad, 2026-05-24. Source: design brief v1.0 and PR 2 documentation. For Sonja to consolidate with Jacob, Jed, and Carol backfill findings.*
