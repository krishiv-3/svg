import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ALL_DEMO_RECORDS,
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_CONTACT,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_NEWS,
  DEMO_NOTICE,
  DEMO_SEO,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
} from './content';

const webRoot = process.cwd();

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Demo-content safeguards.
 *
 * The brief requires that fictional content can never reach a production page.
 * These are the machine-checkable parts of that guarantee; the rest is the
 * architecture (demo data lives in the web app, never in the database).
 */
describe('demo content safety', () => {
  it('marks every demo record', () => {
    expect(ALL_DEMO_RECORDS.length).toBeGreaterThan(20);

    for (const record of ALL_DEMO_RECORDS) {
      expect(record.isDemo).toBe(true);
      expect(record.demoNotice).toBe(DEMO_NOTICE);
    }
  });

  it('states clearly that the content is not a claim about the organisation', () => {
    expect(DEMO_NOTICE).toMatch(/not a verified claim/i);
    expect(DEMO_NOTICE).toMatch(/demonstration/i);
  });

  it('records a content version so a stale copy is obvious', async () => {
    const module = await import('./content');
    expect(module.DEMO_CONTENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
  });

  it('is imported only by the design-system routes and the content seam', () => {
    const appDirectory = path.join(webRoot, 'src/app');
    const offenders: string[] = [];

    for (const file of collectSourceFiles(appDirectory)) {
      const contents = readFileSync(file, 'utf8');
      const importsDemo = /from\s+['"]@\/demo['"]/.test(contents);

      if (!importsDemo) continue;

      const relative = path.relative(webRoot, file).replaceAll('\\', '/');
      if (!relative.startsWith('src/app/design-system/')) {
        offenders.push(relative);
      }
    }

    // The homepage must reach demo content only through `src/content`, never
    // directly, so the production swap is a single change in one file.
    expect(offenders).toEqual([]);
  });

  it('lets only the content demo adapter read the demo dataset', () => {
    const contentDirectory = path.join(webRoot, 'src/content');
    const importers: string[] = [];
    let sawSeam = false;

    for (const file of collectSourceFiles(contentDirectory)) {
      const contents = readFileSync(file, 'utf8');

      if (!/from\s+['"]@\/demo['"]/.test(contents)) continue;

      const relative = path.relative(webRoot, file).replaceAll('\\', '/');
      importers.push(relative);

      if (relative === 'src/content/demo-source.ts') {
        sawSeam = true;
      }
    }

    expect(sawSeam).toBe(true);
    expect(importers).toEqual(['src/content/demo-source.ts']);
  });

  it('is never imported by a shared component', () => {
    const componentsDirectory = path.join(webRoot, 'src/components');
    const offenders: string[] = [];

    for (const file of collectSourceFiles(componentsDirectory)) {
      const contents = readFileSync(file, 'utf8');
      if (/from\s+['"]@\/demo['"]/.test(contents)) {
        offenders.push(path.relative(webRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('adds no demo records to the API seed', () => {
    const seedPath = path.join(webRoot, '..', 'api', 'prisma', 'seed.ts');
    const seed = readFileSync(seedPath, 'utf8');

    expect(seed).not.toMatch(/DEMO_NOTICE|demoNotice|isDemo/);
    expect(seed).not.toMatch(/DEMO_/);
  });

  it('invents no contact details', () => {
    expect(DEMO_CONTACT.lines).toHaveLength(0);
    expect(DEMO_CONTACT.note).toMatch(/verif/i);
  });

  it('labels testimonials as illustrative and not consented', () => {
    for (const testimonial of DEMO_TESTIMONIALS) {
      expect(testimonial.context).toMatch(/illustrative/i);
    }
  });

  it('labels every statistic as illustrative', () => {
    for (const statistic of DEMO_STATISTICS) {
      expect(statistic.note).toMatch(/illustrative/i);
    }
  });

  it('prefixes demo metadata so it cannot be mistaken for real SEO copy', () => {
    for (const entry of DEMO_SEO) {
      expect(`${entry.title} ${entry.description}`).toMatch(/demo|illustrative/i);
    }
  });

  it('keeps campaign amounts in integer minor units', () => {
    for (const campaign of DEMO_CAMPAIGNS) {
      expect(Number.isInteger(campaign.raisedMinor)).toBe(true);
      expect(Number.isInteger(campaign.goalMinor)).toBe(true);
      expect(campaign.raisedMinor).toBeGreaterThan(0);
      expect(campaign.goalMinor).toBeGreaterThanOrEqual(campaign.raisedMinor);
    }
  });

  it('provides enough records to evaluate each layout', () => {
    expect(DEMO_ACTIVITIES).toHaveLength(4);
    expect(DEMO_STATISTICS).toHaveLength(4);
    expect(DEMO_CAMPAIGNS).toHaveLength(2);
    expect(DEMO_NEWS).toHaveLength(3);
    expect(DEMO_GALLERY).toHaveLength(6);
    expect(DEMO_TESTIMONIALS).toHaveLength(3);
    expect(DEMO_HERO.heading.length).toBeGreaterThan(10);
  });
});
