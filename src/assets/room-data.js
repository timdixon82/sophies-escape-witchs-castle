/**
 * Sophie's Escape — Room and puzzle data (ADR 002, src/assets/)
 *
 * This is a leaf layer. It imports nothing from other src/ layers.
 * Pure data: room descriptions, hint text, witch lines.
 *
 * TODO(v0.2): Replace with JSON files (rooms.json, puzzles.json,
 * witch-lines.json) per ADR 002. Static data is fine for v0.1.
 *
 * Hint wording awaits Tim's confirmation (Tad Clarification 1).
 * The placeholders below follow FR-HINT-03 style conventions.
 */

/**
 * Room descriptions used by the ARIA live region on room entry.
 * Gives screen-reader players context about their location.
 * @type {Record<string, string>}
 */
export const ROOM_DESCRIPTIONS = {
  'dungeon-cell':
    'You are in the Dungeon Cell. Stone walls, damp air, and the flicker of a torch. You need to find a way out.',
  'stone-corridor':
    'You are in the Stone Corridor. Wind howls through cracks in the stone. Several doors lead off this passage.',
  kitchen: 'You are in the Kitchen. A cauldron bubbles over the fire. Shelves of jars and bottles line the walls.',
  library:
    'You are in the Library. Rows of ancient books surround you. A locked cabinet stands against the far wall.',
  'great-hall':
    'You are in the Great Hall. Portraits stare down from the walls. A great fireplace crackles at one end.',
  chapel:
    'You are in the Chapel. Eerie coloured light filters through stained glass. An altar stands at the far end.',
  armoury:
    'You are in the Armoury. Weapons are mounted on the walls, though they look decorative. Chests line the floor.',
  'tower-room':
    'You are in the Tower Room. You are high up. Wind buffets the windows. A telescope and a star map sit on a table.',
  'witchs-study':
    'You are in the Witch\'s Study. Spell books surround you. An inactive crystal ball sits on the desk.',
  'castle-gate':
    'You are at the Castle Gate. Daylight glows through the cracks. This is the way out — if you can unlock it.',
};

/**
 * Hint text for each puzzle.
 * Three hints per puzzle, indexed 0–2 (Hint 1, 2, 3).
 *
 * PLACEHOLDER: Wording will be confirmed by Tim (Tad Clarification 1).
 * @type {Record<string, [string, string, string]>}
 */
export const ROOM_HINTS = {
  'cell-escape': [
    'Have you looked carefully at everything in this room?',
    'Something on the walls might help you. Look closely at the torch.',
    'The torch sconce is loose. Interact with it to reveal a hidden key.',
  ],
};

/**
 * Witch encounter lines.
 * Four initial lines per FR-WITCH-03. Tim's confirmation needed for
 * additional lines (Tad Clarification, witch lines pool size).
 * @type {string[]}
 */
export const WITCH_LINES = [
  "You'll never find the way out...",
  "How long have you been stumbling around my castle?",
  "Every second you waste is another second I grow stronger...",
  "Did you check everywhere? I think not...",
];

/**
 * Items in the game.
 * @type {Record<string, { label: string, description: string }>}
 */
export const ITEMS = {
  'rusty-key': {
    label: 'Rusty key',
    description: 'An old iron key, rough with rust. It might open something.',
  },
};
