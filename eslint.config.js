import globals from 'globals';
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import { defineConfig } from 'eslint/config';

export default defineConfig({
  files: ['**/*.js'],
  ignores: ['dist/**', 'src/header.js'],
  extends: [js.configs.recommended, eslintReact.configs.recommended],
  languageOptions: {
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      BdApi: 'readonly',
      React: 'readonly',
      npm_package_version: 'readonly',
      ...globals.browser,
    },
  },
  rules: {
    // Prefix a variable with underscore to mark as intentionally unused.
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    // We commit many react crimes. Oh well.
    '@eslint-react/rules-of-hooks': ['off'],
  },
});
