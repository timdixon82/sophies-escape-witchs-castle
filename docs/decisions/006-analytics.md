# ADR 006: GoatCounter analytics

## Status

Accepted on 2026-05-23 by Jacob, conditional on Tim confirming Tad's Decision 2 recommendation (option A: add GoatCounter).

## Context

The team's standing default for public projects is to add the privacy-friendly analytics service GoatCounter (`https://timdixon82.goatcounter.com`). The standard was set in Decision 002 of the global wiki ("Standing decisions") and reiterated by Tim through the recent ICCC review and the wider analytics rollout flagged in the team's HANDOFF backlog.

Tad's Decision 2 in the project decision log recommends adopting GoatCounter for Sophie's Escape. The privacy cost is effectively zero (no cookies, no personal data, an Internet Protocol address used briefly for country geocoding and then discarded). The value is a per-project mobile-versus-desktop split that informs future development.

ICCC's analytics setup (recorded in ICCC ADR 0009) carries two open gaps the team agreed to close in every later project's setup build: no Subresource Integrity hash on the `count.js` script, and no project-wiki sign-off record. Sophie's Escape's setup is the right place to close both gaps from the start.

The brief and the requirements do not request analytics directly; the addition is a team default and is governed by this ADR.

## Decision

### Use the team's central GoatCounter endpoint

Sophie's Escape sends page views to the team-wide GoatCounter endpoint at `https://timdixon82.goatcounter.com/count`. The page path identifies the project (every project hosted on `timdixon82.github.io` lands under a project sub-path), so the central counter can be filtered to Sophie's Escape views.

This matches the rolled-out canonical pattern Tim approved during the recent wiki upkeep ("GoatCounter default" mentioned in the recent commit log).

If a per-project counter is preferred (per ICCC's open question), the value of `data-goatcounter` is the only thing that changes; the architecture stays the same.

### Self-host `count.js`

The GoatCounter script `count.js` is copied into the repository at `public/scripts/goatcounter-count.js` from the GoatCounter project. It is not loaded from `gc.zgo.at` at runtime. This closes the Subresource Integrity gap by removing the third-party fetch entirely.

A short comment at the top of the self-hosted file records:

- The source (GoatCounter project, the URL the file was downloaded from).
- The version (a GoatCounter release tag or commit hash).
- The licence (European Union Public Licence 1.2, as GoatCounter is licensed today).
- A monthly upstream-watch reminder (the same approach ICCC takes for `coi-serviceworker`, as recorded in ICCC's ADR 0008).

### What is measured

Only page-view events. Sophie's Escape sends a page view for:

- The main page load (the main menu).
- The end-screen view when the player wins.

No per-puzzle telemetry. No witch-encounter telemetry. No inventory telemetry. No timing or completion data is sent. The brief lists these as out of scope and the architecture confirms it.

Three small milestone events are sent through GoatCounter's hit endpoint as named events with no parameters:

- `game-started`: sent once when the player presses New Game from the main menu.
- `room-entered`: sent once per first entry to each of the ten rooms (not on re-entry).
- `game-won`: sent once when the player triggers the escape cutscene.

These three events let the team see what fraction of starters reach each room and what fraction complete the game. They carry no personal data. They do not carry timing data. They do not carry puzzle-specific data.

### Implementation

The analytics layer lives at `src/analytics/` (not in `src/core/` because it is a side-effect layer, not a pure logic layer). The single module exports two functions:

- `trackPageView(path)`: called by the router (one for the menu, one for the end screen).
- `trackEvent(name)`: called by `state.subscribe` when the relevant state change happens.

In code that has never had a user interaction, the analytics module is a no-op until the player consents (see below).

### Implicit consent through the privacy notice

GoatCounter sets no cookies and persists no personal data. Under UK General Data Protection Regulation, the Privacy and Electronic Communications Regulations, and the Information Commissioner's Office guidance, the team's interpretation is that cookieless, no-personal-data analytics do not require an explicit consent banner, but they do require a clear privacy notice.

The privacy notice is part of the Credits screen (per Tad's Decision 3 recommendation A) and the README. It names GoatCounter, lists what is recorded, says no cookies are set and no personal data is stored, links to the GoatCounter project, and explains that the analytics serve only to count plays.

A consent banner would be heavier than this notice and would itself break the accessibility-first feel of the main menu. The notice approach is consistent with the team's standing practice across other projects.

### Allowed in the Content Security Policy

The Content Security Policy (ADR 007) allow-lists `connect-src 'self' https://timdixon82.goatcounter.com` so the analytics ping reaches the GoatCounter server. The `script-src` directive does not need an external entry because the script is self-hosted.

## Alternatives considered

### Load `count.js` from `gc.zgo.at` (the ICCC pattern)

Rejected. ICCC carries a recorded gap (no Subresource Integrity hash, no `crossorigin="anonymous"`). Sophie's Escape is the right place to close that gap, by self-hosting.

### Add a Subresource Integrity hash and keep the `gc.zgo.at` fetch

Considered. Rejected because a Subresource Integrity hash needs a monthly review cadence and a hash bump when GoatCounter updates `count.js`. Self-hosting removes the cadence and is simpler.

### Adopt a richer analytics service (Plausible, Fathom)

Rejected. The team has a working default (GoatCounter). Adding a different service for one project breaks the rollout. Plausible and Fathom are good but they are not the team's current choice.

### No analytics

Rejected per Tad's Decision 2 recommendation and the team's standing default. The privacy cost is effectively zero and the value is real.

### Per-puzzle telemetry to inform game design

Rejected. The brief is explicit that no personal data is collected; per-puzzle telemetry would risk identifying individual players' decision sequences and would change the privacy posture of the game. The three milestone events listed above are the upper bound.

## Consequences

### Positive

- Tim has a count of how many people play Sophie's Escape, what fraction reach each room, and what fraction complete it.
- The privacy posture is clean: no cookies, no personal data, no third-party fetch.
- The Content Security Policy is short (no `script-src` exception).
- The setup build does not carry the ICCC supply-chain gap forward into Sophie's Escape.

### Negative or to manage

- A monthly check that GoatCounter's `count.js` upstream has not changed materially is required, the same way ICCC monitors `coi-serviceworker`. Carol's release process records this in the project's `release-process.md` once she scaffolds it.
- If GoatCounter the service ever goes down, the analytics pings fail silently. The architecture commits to silent failure: `trackPageView` and `trackEvent` swallow any error and never throw into the game loop.
- A privacy-sensitive player can block `https://timdixon82.goatcounter.com` in their own browser without any effect on gameplay. The game does not detect or react to analytics being blocked.

## Cross-references

- `docs/decisions/007-content-security-policy.md`: allow-lists the GoatCounter endpoint in `connect-src`.
- `docs/decisions/009-deployment.md`: the build copies `public/scripts/goatcounter-count.js` to `dist/scripts/`.
- `tad-decisions-for-tim.md` Decision 2 (analytics) and Decision 3 (privacy notice).
- ICCC ADR 0009 (the predecessor pattern, with the gaps Sophie's Escape closes).
- The team's global wiki, `docs/patterns/goatcounter-analytics.md` (to be written by Sonja when the pattern is named cross-cutting).
