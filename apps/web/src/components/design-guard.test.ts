import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { designTokens, palette, statusColors } from '@gaushala/shared';

/**
 * Design-system guardrails.
 *
 * These tests protect the two rules that are easiest to erode during everyday
 * feature work: colours must come from the token layer, and the CSS tokens must
 * stay in sync with the TypeScript source of truth.
 */

const projectRoot = process.cwd();

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('token discipline', () => {
  it('contains no hardcoded hex colours in components, pages or demo data', () => {
    const roots = [
      path.join(projectRoot, 'src/components'),
      path.join(projectRoot, 'src/app'),
      path.join(projectRoot, 'src/demo'),
    ];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of collectSourceFiles(root)) {
        if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;

        const contents = readFileSync(file, 'utf8');
        // Hex colours must live in the token layer (globals.css + tokens.ts).
        const matches = contents.match(/#[0-9a-fA-F]{3,8}\b/g);

        if (matches !== null) {
          offenders.push(`${path.relative(projectRoot, file)} → ${matches.join(', ')}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('declares every palette colour in the CSS token layer', () => {
    const css = readFileSync(path.join(projectRoot, 'src/app/globals.css'), 'utf8').toLowerCase();

    for (const [name, hex] of Object.entries(palette)) {
      expect(css.includes(hex.toLowerCase()), `${name} (${hex}) missing from globals.css`).toBe(
        true,
      );
    }

    for (const [name, hex] of Object.entries(statusColors)) {
      expect(
        css.includes(hex.toLowerCase()),
        `status ${name} (${hex}) missing from globals.css`,
      ).toBe(true);
    }
  });

  it('keeps exactly nine brand colours plus functional status colours', () => {
    expect(Object.keys(palette)).toHaveLength(9);
    expect(Object.keys(statusColors)).toHaveLength(4);
  });

  it('exposes the documented typographic roles', () => {
    expect(Object.keys(designTokens.typography.scale)).toEqual([
      'display',
      'title',
      'heading',
      'subheading',
      'lead',
      'body',
      'bodySmall',
      'label',
      'caption',
      'overline',
    ]);
  });

  it('defines a line height for every typographic role', () => {
    for (const [role, value] of Object.entries(designTokens.typography.scale)) {
      expect(value.lineHeight, `${role} has no line height`).toBeTruthy();
    }
  });

  it('orders the z-index layers without collisions', () => {
    const layers = Object.values(designTokens.zIndex);
    expect(new Set(layers).size).toBe(layers.length);
    expect([...layers].sort((a, b) => a - b)).toEqual(layers);
  });
});
