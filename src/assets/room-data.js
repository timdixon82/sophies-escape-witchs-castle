/**
 * Sophie's Escape — Room and puzzle data (ADR 002, src/assets/)
 *
 * This is a leaf layer. It imports nothing from other src/ layers.
 * Pure data: room descriptions, hint text, witch lines, items, puzzles.
 *
 * v0.2: All ten rooms, items, and puzzles defined here.
 *
 * Hint wording follows FR-HINT-03 style conventions.
 */

/**
 * Room descriptions used by the ARIA live region on room entry.
 * Gives screen-reader players context about their location.
 * @type {Record<string, string>}
 */
export const ROOM_DESCRIPTIONS = {
  'dungeon-cell':
    'You are in the Dungeon Cell. Stone walls, damp air, and the flicker of a torch. There is a locked door. You need to find a way out.',
  'stone-corridor':
    'You are in the Stone Corridor. Wind howls through cracks in the stone. Several doors lead off this passage.',
  kitchen:
    'You are in the Kitchen. A cauldron bubbles over the fire. Shelves of jars and bottles line the walls.',
  library:
    'You are in the Library. Rows of ancient books surround you. A locked cabinet stands against the far wall.',
  'great-hall':
    'You are in the Great Hall. Portraits stare down from the walls. A great fireplace crackles at one end.',
  chapel:
    'You are in the Chapel. Eerie coloured light filters through stained glass. An altar stands at the far end.',
  armoury:
    'You are in the Armoury. Weapons are mounted on the walls, though they look decorative. Chests line the floor.',
  'tower-room':
    'You are in the Tower Room. You are high up. Wind buffets the windows. A telescope sits pointed at the sky.',
  'witchs-study':
    'You are in the Witch\'s Study. Spell books surround you. A lectern stands in the centre, with a plate on the desk.',
  'castle-gate':
    'You are at the Castle Gate. Daylight glows through the cracks. Three pedestals wait for something to be placed in them.',
};

/**
 * Hint text for each puzzle.
 * Three hints per puzzle, indexed 0–2 (Hint 1, 2, 3).
 * @type {Record<string, [string, string, string]>}
 */
export const ROOM_HINTS = {
  'cell-escape': [
    'Look carefully around the room. Something small might be hiding under the stones.',
    'There is a loose stone in the floor. Examine it closely.',
    'Pick up the bent spoon and use it on the cell door to force the lock.',
  ],
  'kitchen-cauldron': [
    'The cauldron looks like it needs several ingredients to produce a result.',
    'You need something from this room and something from the corridor. Check the shelves.',
    'Combine the moonflower petal, pinch of salt, and dried mushroom in the cauldron.',
  ],
  'library-cabinet': [
    'The cabinet is locked. You will need a key from somewhere else in the castle.',
    'The kitchen holds the key to this cabinet — literally.',
    'Use the small iron key on the locked cabinet to open it.',
  ],
  'great-hall-portrait': [
    'The room is dark. You need a light source to see behind the largest portrait.',
    'You have a candle and a rag somewhere. Perhaps they can be combined.',
    'Combine the candle stub and oil-soaked rag to make a lit torch. Use it on the largest portrait.',
  ],
  'chapel-altar': [
    'The altar discs can be turned. There must be a clue somewhere in the castle.',
    'You found a scroll in the library that shows the correct symbol order.',
    'Use the symbol order scroll here. Set the six discs to match the scroll.',
  ],
  'armoury-chest': [
    'The chest is locked. You will need the right key.',
    'The great hall contains the key to this chest.',
    'Use the armoury chest key on the chest to open it.',
  ],
  'tower-telescope': [
    'The telescope can be aligned. There must be a clue about which stars to find.',
    'The portraits in the great hall showed three symbols: chalice, quill, and star.',
    'Align the telescope to the chalice, quill, and star constellations using the portrait clue.',
  ],
  'study-spell': [
    'The lectern and plate need specific items before you can cast the spell.',
    'You need the torn spell book page, the chapel sigil, and the brass star chart.',
    'Place the torn page on the lectern, then place the sigil and star chart on the plate, and press the cast button.',
  ],
  'gate-pedestals': [
    'The three pedestals each need an item to unlock the gate.',
    'You need the iron gate key, the brass star chart, and the charged binding crystal.',
    'Place the iron gate key, brass star chart, and charged binding crystal on the pedestals.',
  ],
};

/**
 * Witch encounter lines.
 * Four initial lines per FR-WITCH-03.
 * @type {string[]}
 */
export const WITCH_LINES = [
  "You'll never find the way out...",
  "How long have you been stumbling around my castle?",
  "Every second you waste is another second I grow stronger...",
  "Did you check everywhere? I think not...",
];

/**
 * All items in the game.
 * label: display name for inventory and announcements.
 * description: longer text for examine/inspect.
 * @type {Record<string, { label: string, description: string }>}
 */
export const ITEMS = {
  'bent-spoon': {
    label: 'Bent spoon',
    description: 'A metal spoon bent at an angle. Might be useful as a crude tool.',
  },
  'candle-stub': {
    label: 'Candle stub',
    description: 'A short stub of candle. Not lit yet, but it could be.',
  },
  'moonflower-petal': {
    label: 'Moonflower petal',
    description: 'A delicate silver-white petal. It glows faintly in the dark.',
  },
  'oil-soaked-rag': {
    label: 'Oil-soaked rag',
    description: 'A cloth soaked in lamp oil. Highly flammable.',
  },
  'pinch-of-salt': {
    label: 'Pinch of salt',
    description: 'A small paper twist of coarse salt. Useful for spells, apparently.',
  },
  'dried-mushroom': {
    label: 'Dried mushroom',
    description: 'A wrinkled dried mushroom. Its smell is earthy and strange.',
  },
  'small-iron-key': {
    label: 'Small iron key',
    description: 'A small iron key, still warm from the cauldron.',
  },
  'symbol-order-scroll': {
    label: 'Symbol order scroll',
    description: 'A scroll with six symbols arranged in a specific order. A clue for the chapel.',
  },
  'torn-spell-book-page': {
    label: 'Torn spell book page',
    description: 'A torn page from a spell book. It contains half of a binding spell.',
  },
  'armoury-chest-key': {
    label: 'Armoury chest key',
    description: 'A heavy key marked with an embossed shield. Opens the armoury chest.',
  },
  'portrait-clue': {
    label: 'Portrait clue (chalice, quill, star)',
    description: 'A mental note of the three symbols you observed in the great hall portraits: chalice, quill, and star.',
  },
  'chapel-sigil': {
    label: 'Chapel sigil',
    description: 'A carved stone disc bearing a complex protective sigil.',
  },
  'iron-gate-key': {
    label: 'Iron gate key',
    description: 'A heavy iron key. It looks like it would open the castle gate.',
  },
  'brass-star-chart': {
    label: 'Brass star chart',
    description: 'An engraved brass plate showing a star chart. It feels important.',
  },
  'lit-torch': {
    label: 'Lit torch',
    description: 'A burning torch made from the candle stub and oil-soaked rag. It burns steadily.',
  },
  'charged-binding-crystal': {
    label: 'Charged binding crystal',
    description: 'A crystal that pulses with a faint magical light. The binding spell is complete.',
  },
};

/**
 * Rooms: which items are found there (before pickup),
 * which doors lead where, and the puzzle ID for the room (if any).
 *
 * items: item IDs that can be picked up in this room.
 * doors: target room IDs accessible from this room.
 * puzzleId: the puzzle the player must solve in this room (if any).
 * examineItems: items that are "observed" rather than picked up (noted in inventory as a clue).
 * @type {Record<string, { items: string[], doors: string[], puzzleId: string|null, examineItems?: string[] }>}
 */
export const ROOM_CONFIG = {
  'dungeon-cell': {
    items: ['bent-spoon', 'candle-stub'],
    doors: ['stone-corridor'],
    puzzleId: 'cell-escape',
  },
  'stone-corridor': {
    items: ['moonflower-petal', 'oil-soaked-rag'],
    doors: ['dungeon-cell', 'kitchen', 'library', 'great-hall', 'chapel', 'armoury', 'tower-room', 'witchs-study', 'castle-gate'],
    puzzleId: null,
  },
  kitchen: {
    items: ['pinch-of-salt', 'dried-mushroom'],
    doors: ['stone-corridor'],
    puzzleId: 'kitchen-cauldron',
  },
  library: {
    items: ['symbol-order-scroll'],
    doors: ['stone-corridor'],
    puzzleId: 'library-cabinet',
    examineItems: ['symbol-order-scroll'],
  },
  'great-hall': {
    items: ['armoury-chest-key'],
    doors: ['stone-corridor'],
    puzzleId: 'great-hall-portrait',
    examineItems: ['portrait-clue'],
  },
  chapel: {
    items: ['chapel-sigil'],
    doors: ['stone-corridor'],
    puzzleId: 'chapel-altar',
  },
  armoury: {
    items: ['iron-gate-key'],
    doors: ['stone-corridor'],
    puzzleId: 'armoury-chest',
  },
  'tower-room': {
    items: ['brass-star-chart'],
    doors: ['stone-corridor'],
    puzzleId: 'tower-telescope',
  },
  'witchs-study': {
    items: ['charged-binding-crystal'],
    doors: ['stone-corridor'],
    puzzleId: 'study-spell',
  },
  'castle-gate': {
    items: [],
    doors: ['stone-corridor'],
    puzzleId: 'gate-pedestals',
  },
};

/**
 * Puzzle definitions: what items are required, what the target object is,
 * and what items are produced on solve.
 *
 * requiredItems: items that must be in inventory (not consumed, unless noted).
 * consumedItems: items consumed (marked consumed) when puzzle is solved.
 * producedItem: item added to inventory when puzzle is solved (if any).
 * target: the interactable object ID in the scene.
 * prerequisitePuzzles: puzzles that must be solved before this one can be triggered.
 * @type {Record<string, {
 *   requiredItems: string[],
 *   consumedItems: string[],
 *   producedItem: string|null,
 *   target: string,
 *   prerequisitePuzzles: string[],
 * }>}
 */
export const PUZZLE_DEFINITIONS = {
  'cell-escape': {
    requiredItems: ['bent-spoon'],
    consumedItems: [],
    producedItem: null,
    target: 'room1-door',
    prerequisitePuzzles: [],
  },
  'kitchen-cauldron': {
    requiredItems: ['moonflower-petal', 'pinch-of-salt', 'dried-mushroom'],
    consumedItems: ['moonflower-petal', 'pinch-of-salt', 'dried-mushroom'],
    producedItem: 'small-iron-key',
    target: 'kitchen-cauldron',
    prerequisitePuzzles: [],
  },
  'library-cabinet': {
    requiredItems: ['small-iron-key'],
    consumedItems: [],
    producedItem: 'torn-spell-book-page',
    target: 'library-cabinet',
    prerequisitePuzzles: ['kitchen-cauldron'],
  },
  'great-hall-portrait': {
    requiredItems: ['lit-torch'],
    consumedItems: ['lit-torch'],
    producedItem: 'armoury-chest-key',
    target: 'great-hall-portrait',
    prerequisitePuzzles: [],
  },
  'chapel-altar': {
    requiredItems: ['symbol-order-scroll'],
    consumedItems: [],
    producedItem: 'chapel-sigil',
    target: 'chapel-altar',
    prerequisitePuzzles: ['library-cabinet'],
  },
  'armoury-chest': {
    requiredItems: ['armoury-chest-key'],
    consumedItems: ['armoury-chest-key'],
    producedItem: 'iron-gate-key',
    target: 'armoury-chest',
    prerequisitePuzzles: ['great-hall-portrait'],
  },
  'tower-telescope': {
    requiredItems: ['portrait-clue'],
    consumedItems: [],
    producedItem: 'brass-star-chart',
    target: 'tower-telescope',
    prerequisitePuzzles: [],
  },
  'study-spell': {
    requiredItems: ['torn-spell-book-page', 'chapel-sigil', 'brass-star-chart'],
    consumedItems: ['torn-spell-book-page', 'chapel-sigil', 'brass-star-chart'],
    producedItem: 'charged-binding-crystal',
    target: 'study-cast-btn',
    prerequisitePuzzles: ['library-cabinet', 'chapel-altar', 'tower-telescope'],
  },
  'gate-pedestals': {
    requiredItems: ['iron-gate-key', 'brass-star-chart', 'charged-binding-crystal'],
    consumedItems: ['iron-gate-key', 'brass-star-chart', 'charged-binding-crystal'],
    producedItem: null,
    target: 'gate-pedestal',
    prerequisitePuzzles: ['armoury-chest', 'tower-telescope', 'study-spell'],
  },
};

/**
 * Valid item combinations (inventory combine mechanic).
 * inputs: sorted pair of item IDs (sorted alphabetically for consistent lookup).
 * output: item ID produced.
 * consumedItems: items consumed from inventory.
 * @type {Array<{ inputs: [string, string], output: string, consumedItems: string[] }>}
 */
export const ITEM_COMBINATIONS = [
  {
    inputs: ['candle-stub', 'oil-soaked-rag'],
    output: 'lit-torch',
    consumedItems: ['candle-stub', 'oil-soaked-rag'],
  },
];
