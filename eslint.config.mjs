// Root ESLint configuration (flat config, ESLint 10).
// Every workspace package is linted from here so rules cannot drift between
// apps. Generated code and build output are ignored.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'apps/api/src/generated/**',
      'packages/shared/dist/**',
      '.pnpm-store/**',
      '.pnpm-cache/**',
      '.local/**',
      '.turbo/**',
      '**/*.d.ts',
      '**/next-env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  // React rules apply only to the Next.js application.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Scripts and tests are allowed to print and to use loose typing where it aids clarity.
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.js', '**/*.test.ts', '**/tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Config files are plain JavaScript/TypeScript at the tooling level.
  {
    files: ['**/*.config.ts', '**/*.config.mjs', 'eslint.config.mjs', '**/prisma.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  prettier,
);
