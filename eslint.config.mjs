import globals from 'globals';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import visualComplexity from 'eslint-plugin-visual-complexity';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default [
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  // all files
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
  // src files
  {
    files: ['src/**/*.ts'],
    plugins: {
      visual: visualComplexity,
    },
    rules: {
      'visual/complexity': ['error', { max: 5 }],
      complexity: 0,

      'max-depth': ['error', { max: 2 }],
      'max-nested-callbacks': ['error', { max: 2 }],
      'max-params': ['error', { max: 3 }],
      'max-statements': ['error', { max: 12 }, { ignoreTopLevelFunctions: false }],
      'max-len': ['error', { code: 120, ignoreUrls: true }],
      'max-lines': ['error', { max: 200, skipComments: true, skipBlankLines: true }],
      semi: ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],
      '@typescript-eslint/triple-slash-reference': 0,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 0,
      'no-empty-pattern': 0,
    },
  },
  {
    files: ['examples/**/*.ts'],
    rules: {
      'max-statements': 0,
      complexity: 0,
      'no-console': 0,
    },
  },
  {
    files: ['test/**/*.{ts,js}'],
    plugins: {
      playwright,
    },
    rules: {
      'max-params': 0,
      'max-statements': 0,
      'no-empty-pattern': 0,
      complexity: 0,
      '@typescript-eslint/no-empty-function': 0,
      'playwright/no-focused-test': 'error',
    },
  },
];
