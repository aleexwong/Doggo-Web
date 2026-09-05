import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

/**
 * Flat config. Prettier owns formatting, so `prettier` goes last in every
 * block and switches off the stylistic rules — anything ESLint reports here
 * is a real problem, not a matter of taste.
 */
export default tseslint.config(
  { ignores: ['dist', 'dist-e2e', 'node_modules'] },

  // The app: browser globals, React rules, type-aware linting.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // An empty catch is how this codebase says "storage/matchMedia may be
      // blocked, and that is fine" — the comment inside carries the reason.
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Unit tests: Node globals, and non-null assertions are fine on fixtures.
  {
    files: ['test/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // The Cloud Function is plain CommonJS on Node.
  {
    files: ['functions/**/*.js'],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  // The e2e runner is Node, but the bodies of page.evaluate/$$eval callbacks
  // are serialized and run in the browser — so both sets of globals are real.
  {
    files: ['e2e/**/*.mjs', 'eslint.config.js'],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
)
