/**
 * Verify that the design tokens defined in TypeScript and the CSS custom
 * properties used by Tailwind agree.
 *
 * The palette and scale exist in two places by necessity: `globals.css` (for
 * Tailwind utilities) and `tokens.ts` (for non-CSS surfaces such as receipt
 * PDFs, and as typed documentation). This check fails the build if they drift.
 *
 * It also enforces that every typographic role defines a line height, because a
 * missing line height silently falls back to the browser default and breaks the
 * vertical rhythm.
 *
 * Usage:
 *   pnpm check:tokens
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokensFile = path.join(rootDirectory, 'packages/shared/src/design/tokens.ts');
const cssFile = path.join(rootDirectory, 'apps/web/src/app/globals.css');

const tokensSource = readFileSync(tokensFile, 'utf8');
const cssSource = readFileSync(cssFile, 'utf8').toLowerCase();

let failures = 0;

/* -------------------------------------------------------------- colour ---- */

// Every six-digit hex literal in the token file must reach the CSS layer.
const colourEntries = [...tokensSource.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((match) => ({
  name: match[1],
  hex: match[2].toLowerCase(),
}));

if (colourEntries.length === 0) {
  console.error('[check:tokens] No colour entries found in tokens.ts');
  process.exit(1);
}

const missingColours = colourEntries.filter((entry) => !cssSource.includes(entry.hex));

if (missingColours.length > 0) {
  console.error('[check:tokens] These colours exist in tokens.ts but not in globals.css:');
  for (const entry of missingColours) {
    console.error(`  - ${entry.name} ${entry.hex}`);
  }
  failures += 1;
} else {
  console.info(
    `[check:tokens] ${String(colourEntries.length)} colour tokens match between tokens.ts and globals.css`,
  );
}

/* ---------------------------------------------------------- typography ---- */

// Roles declared in the TypeScript scale must exist as Tailwind text roles.
const cssRaw = readFileSync(cssFile, 'utf8');
const textRoles = [...cssRaw.matchAll(/--text-([a-z0-9-]+):/g)]
  .map((match) => match[1])
  .filter((role) => !role.includes('--'));

const uniqueRoles = [...new Set(textRoles)];

const missingLineHeights = uniqueRoles.filter(
  (role) => !cssRaw.includes(`--text-${role}--line-height:`),
);

if (uniqueRoles.length === 0) {
  console.error('[check:tokens] No typographic roles found in globals.css');
  failures += 1;
} else if (missingLineHeights.length > 0) {
  console.error('[check:tokens] These text roles have no line height:');
  for (const role of missingLineHeights) {
    console.error(`  - --text-${role}`);
  }
  failures += 1;
} else {
  console.info(
    `[check:tokens] ${String(uniqueRoles.length)} typographic roles define a line height`,
  );
}

/* ------------------------------------------------------------- gradients -- */

// Gradient tokens are longer strings, so they are matched by name rather than
// by value: each key in `tokens.gradients` must have a `--gradient-*` property.
const gradientBlock = tokensSource.match(/export const gradients = \{([\s\S]*?)\} as const;/);

if (gradientBlock === null) {
  console.error('[check:tokens] Could not find the gradients token block in tokens.ts');
  failures += 1;
} else {
  const gradientNames = [...gradientBlock[1].matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((match) =>
    match[1].replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
  );

  const missingGradients = gradientNames.filter((name) => !cssRaw.includes(`--gradient-${name}:`));

  if (missingGradients.length > 0) {
    console.error('[check:tokens] These gradients exist in tokens.ts but not in globals.css:');
    for (const name of missingGradients) {
      console.error(`  - --gradient-${name}`);
    }
    failures += 1;
  } else {
    console.info(`[check:tokens] ${String(gradientNames.length)} gradient tokens match`);
  }
}

/* -------------------------------------------------------------------------- */

if (failures > 0) {
  process.exit(1);
}
