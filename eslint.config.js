import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'docs/', 'node_modules/', 'coverage/', 'test-results/', '.cache/'] },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', '*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // The codebase is written without `any`; keep it that way.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Deliberate `while (true)`-style game loops are fine; accidental ones are not.
      'no-constant-condition': ['error', { checkLoops: 'allExceptWhileTrue' }],
    },
  },
  {
    files: ['eslint.config.js', '*.config.ts'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
  },
);
