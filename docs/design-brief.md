# Sophie's Escape: The Witch's Castle
## Game Design Brief — Version 1.0

---

## 1. Overview

**Title:** Sophie's Escape: The Witch's Castle  
**Genre:** First-person puzzle adventure  
**Platform:** Browser-based (mobile and desktop), fully client-side — no server-side engine required  
**Target Audience:** Ages 9 and up, family friendly  
**Estimated Play Time:** 30–60 minutes  
**Main Character:** Sophie  
**Primary Antagonist:** The Witch  

---

## 2. Concept Summary

Sophie is trapped inside an ancient, atmospheric witch's castle. To escape, she must explore ten interconnected rooms, collect items, solve inventory-based puzzles, and piece together the path to freedom — all while the witch watches from her crystal ball, adding tension and time pressure. There are no lives or death states; the experience is about solving, exploring, and escaping.

---

## 3. Technical Requirements

- **Engine:** Client-side 3D browser engine (e.g. Three.js or Babylon.js) — fast, lightweight, no server required
- **Rendering:** First-person perspective, real-time 3D
- **Performance:** Must be fast and responsive on both mobile and desktop hardware
- **Controls:** Full keyboard support AND full touchscreen support — must be equally playable on both
- **Accessibility:** As accessible as possible. This includes:
  - Full keyboard navigation throughout all menus, inventory, and gameplay
  - Touch targets of adequate size for touchscreen use
  - Clear, readable fonts with strong contrast
  - Sound design with visual cues accompanying audio events where possible
  - Hint system to support players who get stuck
  - Pause and resume functionality at any point
- **Save State:** Game state must persist during a session; player can pause and return

---

## 4. Visual Style

- Dark, atmospheric castle aesthetic — stone walls, flickering torches, shadows
- First-person 3D exploration through castle rooms
- Each room distinct in appearance and feel (e.g. dungeon cell, library, kitchen, tower, chapel)
- Witch cutscenes rendered in a stylised, slightly storybook-spooky visual style
- UI elements (inventory, hints, pause) clean and accessible — high contrast, large tap targets
- Colour palette: deep stone greys, amber torch light, purple/green magical accents

---

## 5. Audio Design

All sounds sourced from the **BBC Sound Effects Library** (bbcrewind.co.uk/sound-effects).  
Key sounds to source and implement:

| Sound Event | Example BBC SFX to find |
|---|---|
| Footsteps on stone corridor | Stone/castle footsteps |
| Witch cackle (cutscene) | Witch laugh / cackle |
| Cauldron bubbling | Bubbling liquid / cauldron |
| Door creaking open | Creaking wooden/stone door |
| Item picked up | Magical chime / sparkle |
| Puzzle solved | Success chime |
| Witch appearing (tension sting) | Dramatic sting / horror accent |
| Inventory open/close | Parchment rustle / UI click |
| Ambient castle atmosphere | Wind in stone corridors, distant drips |
| Escape / win | Triumphant fanfare |

All audio should loop or trigger contextually. Ambient sounds play continuously per room.

---

## 6. Gameplay Mechanics

### 6.1 Exploration
- Sophie moves through the castle in first-person
- Players can look around each room by dragging (touch) or mouse movement (desktop)
- Interactable objects highlighted on hover/focus
- Players can move between rooms freely — navigation via visible doorways or a simple map

### 6.2 Room Structure
- **10 rooms** total, each with a distinct theme and purpose
- Rooms are not strictly linear — players can roam freely
- However, there are **item dependencies**: certain puzzles require items found in other rooms, creating a natural sequence without locked doors
- Example: To open the library cabinet (Room 3), Sophie needs a key found in the kitchen (Room 6)
- Dependencies are designed so players naturally explore before solutions become available

### 6.3 Suggested Room List
1. **The Dungeon Cell** — Starting room. Basic intro puzzle. Find a way out of the cell.
2. **The Stone Corridor** — Links multiple rooms. Atmospheric. Small item hidden here.
3. **The Kitchen** — Cauldron, shelves, hidden items. Puzzle involving ingredients.
4. **The Library** — Books, locked cabinet, scrolls. Riddle-based puzzle.
5. **The Great Hall** — Large central room. Portraits, fireplace. Multi-item puzzle.
6. **The Chapel** — Eerie stained glass, altar. Puzzle with symbols/patterns.
7. **The Armoury** — Weapons on walls (decorative), chests. Lock and key puzzle.
8. **The Tower Room** — High up, wind sounds. Telescope, star map. Observational puzzle.
9. **The Witch's Study** — Most atmospheric room. Crystal ball (inactive), spell books. Complex multi-item puzzle.
10. **The Castle Gate** — Final room. All previous puzzle solutions combine to open the gate. Escape!

### 6.4 Inventory System
- Inventory accessible at any time via a clear button/icon (or keyboard shortcut `I`)
- Inventory displays all collected items visually as icons with labels
- **To combine items:** Player manually selects two or more items in the inventory — tap/click each to select (highlighted state), then tap/click a "Use Together" or "Combine" button
- If combination is valid, a result occurs (new item created, or puzzle progresses)
- If combination is invalid, a gentle "that doesn't work" response (no penalty)
- Items can also be used individually on objects in the environment by selecting item then tapping/clicking the object
- Inventory panel slides in/out smoothly — accessible by keyboard and touch

### 6.5 Puzzle Design
- Mix of **inventory-based puzzles** (collect and combine items) and **interactive puzzles** (clicking/tapping objects in the room)
- Difficulty scales across the ten rooms — earlier rooms easier, later rooms harder
- All puzzles are logical and fair — no pixel hunting, no arbitrary solutions
- Examples of puzzle types:
  - Find two items and combine them to create a tool
  - Use an item on an object in the environment
  - Observe a pattern in one room and replicate it in another
  - Decipher a simple written clue from a book or scroll
  - Match symbols or colours

### 6.6 Hint System
- Each puzzle has **3 hints**, revealed one at a time
- Player taps/clicks a "Hint" button (accessible via keyboard too)
- Hint 1: Subtle nudge (e.g. "Have you looked carefully at everything in this room?")
- Hint 2: More specific direction (e.g. "The symbol on the altar matches something you've seen elsewhere...")
- Hint 3: Near-solution guidance (e.g. "Combine the candle and the mirror, then use them on the altar")
- Hints are unlimited in the sense that all 3 are always available per puzzle — no global hint economy

---

## 7. The Witch — Encounter Design

### 7.1 Trigger
- The witch appears **after a set time has elapsed** while Sophie is working on a puzzle (e.g. 3–5 minutes on the same puzzle without solving it)
- She does **not** chase Sophie or enter the game world

### 7.2 Cutscene Flow
1. Gameplay pauses
2. Screen transitions to the witch at her crystal ball, looking in at Sophie
3. The witch says something menacing (short voiced or text line — e.g. *"You'll never escape, little one..."* or *"Still stuck, are we? How delightful..."*)
4. Short animation — crystal ball glows, witch cackles
5. Screen cuts back to gameplay — game resumes
6. Adds atmosphere and mild time pressure without punishing the player

### 7.3 Frequency
- Can appear multiple times across the game session
- Should not appear more than once per 5 minutes to avoid feeling repetitive
- Appears more frequently in later rooms to increase tension

### 7.4 Witch Lines (Suggestions)
- *"You'll never find the way out..."*
- *"How long have you been stumbling around my castle?"*
- *"Every second you waste is another second I grow stronger..."*
- *"Did you check everywhere? I think not..."*

---

## 8. Pause & Exit System

- **Pause:** Triggered by pressing `Escape` (keyboard) or tapping a clearly visible pause icon (touch)
- Pause screen displays:
  - Resume button
  - Hint button (for current puzzle)
  - Settings (volume, etc.)
  - Exit to Main Menu
- Game state is fully preserved when paused
- Player can exit to main menu and return to exactly where they left off (session-based save)
- Main menu includes: New Game, Continue (if session exists), Credits

---

## 9. Controls Reference

| Action | Keyboard | Touchscreen |
|---|---|---|
| Move forward/back | W/S or Arrow keys | Swipe / on-screen joystick |
| Look around | Mouse move | Drag finger |
| Interact with object | E or Click | Tap object |
| Open inventory | I | Inventory button |
| Select inventory item | Click | Tap |
| Combine items | Select items + Enter | Select items + Combine button |
| Open hints | H | Hint button |
| Pause | Escape | Pause button |
| Navigate menus | Tab + Enter | Tap |

---

## 10. Win Condition

- Sophie reaches the Castle Gate (Room 10) with all required puzzle solutions and items
- Final puzzle unlocks the gate using a combination of items/solutions gathered across the castle
- Escape cutscene plays — Sophie runs out into daylight
- End screen: congratulations message, time taken, a short fun message from Sophie
- Option to restart or share

---

## 11. No Lives / No Failure States

- There are no lives, no death, no game over
- Players cannot fail — they can always try again, use hints, or explore further
- The only "pressure" is the witch's periodic appearances
- This keeps the game accessible and enjoyable for all ages within the target range

---

## 12. Out of Scope (for this version)

- Multiplayer
- Server-side saving or accounts
- Procedurally generated puzzles
- Any backend infrastructure

---

## 13. Suggested Tech Stack for AI Builder

- **3D Engine:** Three.js (lightweight, browser-native, excellent mobile support) or Babylon.js
- **Audio:** Howler.js for audio management
- **State Management:** Vanilla JS object or lightweight store (no framework needed)
- **UI Layer:** HTML/CSS overlay on top of 3D canvas for inventory, hints, menus
- **No build tools required** — single HTML file or minimal file structure deployable as static site
- **BBC SFX:** Download and bundle locally as MP3/OGG files

---

*Brief prepared for: Sophie's Escape: The Witch's Castle*  
*Designed by: Tim Dixon & Sophie*  
*Date: May 2026*
