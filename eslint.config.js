import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default ts.config(
  {
    ignores: ['.svelte-kit/**', 'src-tauri/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte.ts'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'on',
      'svelte/no-at-html-tags': 'off',
    },
  },
);
