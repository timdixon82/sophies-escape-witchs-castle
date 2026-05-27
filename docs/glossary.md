# Project Glossary: Sophie's Escape: The Witch's Castle

Domain terms specific to this project, defined as the team meets them. Terms that apply across every project live in the global wiki's glossary at the team root.

Entries are listed in alphabetical order. Each entry gives the term, a plain-language definition, and a pointer to the design brief section or requirements section where the term first appears.

---

## A

### Ambient sound

A looping audio track that plays continuously while Sophie is in a given room. Each room has its own ambient sound (for example, wind in the Stone Corridor, cauldron bubbling in the Kitchen). The ambient sound gives each space a distinct atmosphere and provides an audio layer beneath event sounds. See also: event sound.

[Ref: design brief section 5; requirements FR-AUDIO-01]

---

## B

### BBC Sound Effects Library

The BBC's publicly accessible archive of sound recordings, available at bbcrewind.co.uk/sound-effects. The library is free for personal and educational non-commercial use. Commercial use requires a separate licence from the BBC. All audio in Sophie's Escape is sourced from this library. See Decision 5 in the decision log for the licence position.

[Ref: design brief section 5; requirements section 18]

---

## C

### Castle Gate

Room 10, the final room of Sophie's Escape. The Castle Gate is the escape point. Sophie must bring together items and solutions from all earlier rooms to solve the culminating puzzle and trigger the escape cutscene. See also: win condition.

[Ref: design brief section 6.3; requirements section 16]

### Crystal-ball cutscene

A short gameplay interruption in which the witch is shown watching Sophie through her crystal ball. The cutscene pauses gameplay, shows the witch delivering a menacing line, plays a brief animation, and then returns the player to the exact game state they were in. The crystal-ball cutscene is the only way the witch appears; she never enters Sophie's game world directly. See also: witch encounter, witch trigger.

[Ref: design brief section 7.2; requirements FR-WITCH-02]

---

## F

### First-person perspective

A viewpoint in which the camera is positioned at Sophie's eye level, looking in the direction Sophie faces. The player sees the game world as if through Sophie's eyes: they cannot see Sophie's body or face. First-person perspective is standard in exploration and puzzle games because it is immersive and requires minimal character animation.

[Ref: design brief section 3; requirements FR-NAV-01]

---

## H

### Hint cascade

The three-step hint system used by each puzzle. The player requests hints one at a time. Hint 1 is a subtle room-level nudge; Hint 2 is a more specific puzzle direction; Hint 3 is near-solution guidance that names the items or actions needed. All three hints remain available once revealed; there is no global hint economy. The cascade is designed so a player who follows all three hints will always be able to solve the puzzle.

[Ref: design brief section 6.6; requirements FR-HINT-01 to FR-HINT-03]

---

## I

### Inventory combination

The action of selecting two or more items in the inventory and activating the Combine button to produce a result. A valid combination creates a new item or advances a puzzle. An invalid combination shows a gentle non-punishing failure message. Inventory combination is distinct from using a single item on an environmental object, which is called item use.

[Ref: design brief section 6.4; requirements FR-INV-04]

### Item dependency

A relationship between rooms in which a puzzle in one room requires an item or solution found in a different room. Item dependencies create the game's natural progression without locking doors. For example, the Library cabinet may require a key found in the Armoury. A network of item dependencies is what makes the ten rooms interconnected rather than merely sequential.

[Ref: design brief section 6.2; requirements section 16]

---

## P

### Puzzle solved state

The condition of a puzzle after the player has completed it. A solved puzzle no longer generates hint suggestions and no longer contributes to the witch trigger timer for that room. Items associated with the puzzle are consumed or transformed as appropriate. The solved state is stored in the session save.

[Ref: design brief section 6.5; requirements OR-SAVE-01]

---

## R

### Room dependency

Synonym for item dependency in this project's context. A room is said to have a dependency on another room when its puzzle requires an item sourced from that other room. The design brief uses "item dependencies" and "room dependencies" interchangeably. This glossary uses "item dependency" as the preferred term.

[Ref: design brief section 6.2]

---

## S

### Session save

The stored game state that persists within a browser session (interpreted as the browser tab's lifetime). The session save records: rooms visited, items collected, puzzles solved, current room, hint progress, witch encounter count, and time elapsed. It is stored in browser session storage and contains no personal data. See also: Clarification 4 in the clarification log for the open question about tab-close versus window-close behaviour.

[Ref: design brief section 8; requirements OR-SAVE-01]

### Storybook-spooky

The visual style specified in the design brief for the witch and the witch encounter cutscenes. Storybook-spooky means: stylised, slightly exaggerated proportions, warm but muted colour palette (deep greys, amber, purple, and green), expressive character rendering, and an atmosphere that is atmospheric and menacing rather than frightening or gory. The style is age-appropriate for players nine and up. Simon's design pass will specify the exact visual treatment. See Decision 9 in the decision log.

[Ref: design brief section 4; requirements section 17]

---

## V

### Vestibular check

A test procedure applied to all motion, animation, and camera movement in the game to ensure they do not trigger vestibular discomfort (dizziness, nausea, or disorientation). The check was established as a team standard during the ICCC project. For Sophie's Escape, the vestibular check covers: look range constraints, slide-in animations, cutscene transitions, and any particle effects. The check is run by Carol as part of every accessibility test pass. Animations must also respond to the operating system's `prefers-reduced-motion: reduce` setting.

[Ref: requirements NFR-ACC-03; ICCC project vestibular work]

---

## W

### Win condition

The state reached when Sophie solves the final puzzle in Room 10 (the Castle Gate), triggering the escape cutscene, the end screen with completion time, and the option to play again. The win condition is the only success state; there are no intermediate win states. See also: Castle Gate.

[Ref: design brief section 10; requirements FR-WIN-01]

### Witch encounter

The sequence triggered when Sophie has spent too long on a single puzzle. The encounter runs as a crystal-ball cutscene. The witch appears, delivers a menacing line, and gameplay resumes. The encounter adds atmosphere and mild time pressure without penalising the player. See also: crystal-ball cutscene, witch trigger.

[Ref: design brief section 7; requirements FR-WITCH-01 to FR-WITCH-03]

### Witch trigger

The timer mechanism that starts when Sophie enters a room with an unsolved puzzle. When the timer exceeds the threshold (three to five minutes, shorter in later rooms), the witch encounter fires. The timer pauses when Sophie pauses the game. The trigger does not fire more than once per five-minute window. See also: witch encounter.

[Ref: design brief section 7.1; requirements FR-WITCH-01]
