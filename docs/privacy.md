# Privacy: Sophie's Escape: The Witch's Castle

This document records the privacy posture for Sophie's Escape: The Witch's Castle. It is produced during the project setup pass and updated whenever the analytics or data collection approach changes.

## Analytics

Sophie's Escape ships no analytics. There is no GoatCounter, Plausible, Google Analytics, or any other analytics tool wired into the build. No telemetry is sent from the game client to any server. Any future analytics decision is recorded as an Architecture Decision Record under `docs/decisions/` and reflected in this page before being shipped.

## Data collection statement

The project collects no personal data. The game runs entirely in the player's browser. Game state (current room, inventory, puzzle progress, settings) is persisted locally to the browser's local storage; it never leaves the device. No account is created, no email address is requested, and no identifier is generated server-side. There is no server-side processing of player data of any kind.

## Third-party services

The game does not call or embed any third-party service at runtime. All assets (textures, audio, models) ship with the build. The only third-party-hosted material is the audio sourced from the BBC Sound Effects Library, which is downloaded at build time and bundled into the deployment artefact; it is not loaded from a third-party origin at runtime.

GitHub Pages is the deployment host, which is a third-party service in the operational sense but is the origin from which the site itself is served, not a third-party embedded in the site.

## UK GDPR obligations

The project processes no personal data. UK GDPR therefore imposes no operational obligations on this project. If future changes introduce analytics, account creation, multiplayer state, or any other personal-data processing, this page must be updated to record the lawful basis, retention periods, and data-subject-rights process before the change ships.

### Lawful basis

Not applicable — no personal data is processed.

### Retention periods

Not applicable — no personal data is processed.

### Data subject rights

Not applicable — no personal data is processed.
