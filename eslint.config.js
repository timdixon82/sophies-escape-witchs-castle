// ESLint flat config (ESLint 9+).
// Mirrors the rule set previously in .eslintrc.json, migrated to flat config
// because ESLint v9+ dropped support for the legacy .eslintrc format.
//
// Sophie's Escape ships ES modules (type: module) built by Vite: src/**/*.js
// runs in the browser, vite.config.js runs in Node. Both get browser and
// Node globals so no-undef-style checks (if ever enabled) would not false-
// positive on either environment's built-ins.

import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'public/scripts/goatcounter-count.js',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
