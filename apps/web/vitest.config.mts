import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the design system.
 *
 * These run in Node with `react-dom/server`, no browser and no jsdom: the
 * components are rendered to static markup and their accessibility contract is
 * asserted against the real output. That keeps the suite fast and catches the
 * mistakes that matter (missing label bindings, wrong ARIA roles) without a
 * runtime DOM.
 *
 * The project tsconfig uses `jsx: "preserve"` because Next.js compiles JSX
 * itself, so the test runner is told to use the automatic JSX transform.
 *
 * `next/image` is aliased to a plain `<img>` stub because the Next.js image
 * component cannot render outside the Next runtime.
 */
export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'react' },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'next/image': fileURLToPath(new URL('./src/test/next-image-stub.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    reporters: ['default'],
    passWithNoTests: false,
  },
});
