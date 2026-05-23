# Sophie's Escape: The Witch's Castle

A first-person browser 3D puzzle adventure. Sophie is trapped in an atmospheric witch's castle. To escape, she explores ten interconnected rooms, collects items, solves inventory-based puzzles, and pieces together the path to freedom — all while the witch watches from her crystal ball.

There are no lives, no death, no failure states. The experience is about solving, exploring, and escaping.

## Status

In setup. The repository was created on 2026-05-23. The design brief is at `docs/design-brief.md`. The project wiki is being scaffolded; architecture decisions, the 3D engine pick, and the visual design land in the next phase.

## Target audience

Ages nine and up, family friendly. Estimated play time thirty to sixty minutes.

## Technology

Browser-based, fully client-side. No server, no upload, no accounts. The 3D engine pick (Three.js or Babylon.js) is recorded as an architecture decision in the project wiki at `docs/decisions/`. Audio is sourced from the BBC Sound Effects Library at `bbcrewind.co.uk/sound-effects`.

## Accessibility

This project targets the Web Content Accessibility Guidelines (WCAG) 2.2 at AAA conformance. The brief commits to: full keyboard navigation everywhere; touchscreen parity; large touch targets; strong contrast; visual cues alongside every audio event; a three-step hint system; and a pause that preserves state. The project's interpretation of AAA lives at `docs/accessibility.md`.

## How to play

Once the first playable build lands, this section will name the entry point and the controls. For now, the controls reference is in section 9 of `docs/design-brief.md`.

## Licence

To be confirmed. Tim Dixon's other projects use the MIT Licence; this project will likely follow the same pattern once the dependencies have been audited (Three.js / Babylon.js, Howler.js, BBC SFX terms).

## Project wiki

- `docs/index.md`: catalogue of every project-wiki page.
- `docs/design-brief.md`: the original game design brief (version 1.0, 2026-05-23).
- `docs/log.md`: chronological, append-only operations log for the project.
- `docs/glossary.md`: project-specific terms.
- `docs/accessibility.md`: the project's WCAG 2.2 AAA interpretation.
- `docs/coding-standards.md`: project-specific coding standards.
- `docs/decisions/`: architecture decision records.
- `docs/exceptions/`: any accessibility or security exceptions, with rationale.
- `docs/patterns/`: project-specific reusable patterns.
