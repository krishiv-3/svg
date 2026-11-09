/**
 * Remove build output for the given workspace packages.
 *
 * Usage:
 *   node scripts/clean.mjs apps/api apps/web packages/shared
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('Usage: node scripts/clean.mjs <path> [path...]');
  process.exit(1);
}

const removable = ['dist', '.next', 'tsconfig.tsbuildinfo', 'src/generated'];

for (const target of targets) {
  for (const entry of removable) {
    const fullPath = path.join(rootDirectory, target, entry);
    if (existsSync(fullPath)) {
      rmSync(fullPath, { recursive: true, force: true });
      console.info(`removed ${path.relative(rootDirectory, fullPath)}`);
    }
  }
}
