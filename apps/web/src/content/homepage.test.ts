import { SITE_NAME } from '@gaushala/shared';
import { describe, expect, it } from 'vitest';

import { demoHomepageContent } from './homepage.demo';

/**
 * The homepage content contract is the boundary the CMS will fill. These tests
 * protect the promises the UI relies on: money is minor units, every figure has
 * an evidence note, and no demonstration content invents a verifiable fact.
 *
 * The loader itself (`./index`) is `server-only` because it fetches the API, so
 * it is covered by the API integration tests rather than here.
 */

describe('homepage content', () => {
  it('exposes the dataset the loader serves in demo mode', () => {
    expect(demoHomepageContent.hero.heading.length).toBeGreaterThan(0);
  });

  it('provides every section the page renders', () => {
    const content = demoHomepageContent;

    expect(content.hero.heading.length).toBeGreaterThan(0);
    expect(content.about.body.length).toBeGreaterThan(0);
    expect(content.activities.items.length).toBe(4);
    expect(content.impact.stats.length).toBeGreaterThan(0);
    expect(content.campaigns.items.length).toBeGreaterThan(0);
    expect(content.news.items.length).toBeGreaterThan(0);
    expect(content.events.items.length).toBeGreaterThan(0);
    expect(content.gallery.items.length).toBeGreaterThan(0);
    expect(content.testimonials.items.length).toBeGreaterThan(0);
    expect(content.finalCta.primary.href).toBe('/donate');
  });

  it('keeps money in integer minor units', () => {
    for (const campaign of demoHomepageContent.campaigns.items) {
      expect(Number.isInteger(campaign.raisedMinor)).toBe(true);
      expect(Number.isInteger(campaign.goalMinor)).toBe(true);
      expect(campaign.goalMinor).toBeGreaterThan(0);
      expect(campaign.raisedMinor).toBeLessThanOrEqual(campaign.goalMinor);
    }
  });

  it('gives every impact figure an evidence note', () => {
    for (const statistic of demoHomepageContent.impact.stats) {
      expect(statistic.note.length).toBeGreaterThan(0);
      expect(statistic.note.toLowerCase()).toContain('illustrative');
    }
  });

  it('labels demonstration content where it could be mistaken for fact', () => {
    expect(demoHomepageContent.impact.footnote.toLowerCase()).toContain('illustrative');
    expect(demoHomepageContent.campaigns.footnote.toLowerCase()).toContain('demonstration');
    expect(demoHomepageContent.testimonials.footnote.toLowerCase()).toContain('fictional');
    expect(demoHomepageContent.finalCta.note.toLowerCase()).toContain('not open');
  });

  it('invents no registration, tax, address or phone details', () => {
    const serialised = JSON.stringify(demoHomepageContent).toLowerCase();

    for (const forbidden of [
      '80g',
      '12a',
      'pan ',
      'registration no',
      'gstin',
      'ifsc',
      'account number',
      '+91',
      '@gmail',
      'pincode',
    ]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it('gives every image slot a descriptive label and no stock source', () => {
    const images = [
      demoHomepageContent.hero.image,
      demoHomepageContent.about.image,
      ...demoHomepageContent.gallery.items.map((item) => item.image),
    ];

    for (const image of images) {
      expect(image.label.length).toBeGreaterThan(0);
      expect(image.src).toBeUndefined();
    }
  });

  it('keeps the organisation name out of the homepage title', () => {
    // The root layout template adds "| Shri Vanshidhar Gaushala"; repeating it
    // in the page title would render the brand twice.
    expect(demoHomepageContent.seo.title).not.toContain(SITE_NAME);
    expect(demoHomepageContent.seo.title.length + 3 + SITE_NAME.length).toBeLessThanOrEqual(65);
  });
});
