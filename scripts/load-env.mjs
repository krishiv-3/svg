/**
 * Minimal `.env` reader for repository scripts.
 *
 * The scripts at the repository root intentionally have no runtime dependency
 * on `dotenv`: they must work immediately after `pnpm install` without pulling a
 * package into the root manifest. The format we accept is the subset dotenv
 * supports in this repository — `KEY=value`, `#` comments, blank lines and
 * optional single or double quotes.
 *
 * Existing process environment variables win unless `override` is requested
 * (CI sets real values; a local file must not silently replace them).
 */
import { existsSync, readFileSync } from 'node:fs';

export function parseEnvFile(contents) {
  const result = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (key === '') continue;

    let value = line.slice(separator + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export function loadEnvFile(file, { override = false } = {}) {
  if (!existsSync(file)) return {};

  const parsed = parseEnvFile(readFileSync(file, 'utf8'));

  for (const [key, value] of Object.entries(parsed)) {
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return parsed;
}
