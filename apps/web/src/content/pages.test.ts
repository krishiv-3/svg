import { SITE_NAME } from '@gaushala/shared';
import { describe, expect, it } from 'vitest';

import {
  demoAboutPage,
  demoCampaignsPage,
  demoContactPage,
  demoEventsPage,
  demoGalleryPage,
  demoNewsPage,
  demoOurWorkPage,
  findCampaign,
  findEvent,
  findNews,
} from './pages.demo';

/**
 * Phase 5 content contracts, asserted against the demonstration dataset.
 *
 * The loaders themselves live in `./index` and are `server-only` (they fetch the
 * API), so these tests exercise the dataset directly.
 */

const getAboutPage = async () => demoAboutPage;
const getOurWorkPage = async () => demoOurWorkPage;
const getCampaignsPage = async () => demoCampaignsPage;
const getEventsPage = async () => demoEventsPage;
const getNewsPage = async () => demoNewsPage;
const getGalleryPage = async () => demoGalleryPage;
const getContactPage = async () => demoContactPage;
const getCampaign = async (slug: string) => findCampaign(slug);
const getEvent = async (slug: string) => findEvent(slug);
const getNewsArticle = async (slug: string) => findNews(slug);
const getCampaignSlugs = async () => demoCampaignsPage.items.map((item) => item.slug);
const getEventSlugs = async () =>
  [...demoEventsPage.upcoming, ...demoEventsPage.past].map((e) => e.slug);
const getNewsSlugs = async () => demoNewsPage.items.map((item) => item.slug);

/**
 * Phase 5 content loaders.
 *
 * These protect the promises the pages rely on: unique slugs, lookups that miss
 * cleanly, and demonstration content that never invents a contact detail or a
 * verifiable organisation claim.
 */

describe('page content loaders', () => {
  it('resolves every public page', async () => {
    await expect(getAboutPage()).resolves.toBeDefined();
    await expect(getOurWorkPage()).resolves.toBeDefined();
    await expect(getCampaignsPage()).resolves.toBeDefined();
    await expect(getEventsPage()).resolves.toBeDefined();
    await expect(getNewsPage()).resolves.toBeDefined();
    await expect(getGalleryPage()).resolves.toBeDefined();
    await expect(getContactPage()).resolves.toBeDefined();
  });

  it('exposes unique campaign slugs that resolve to the same record', async () => {
    const slugs = await getCampaignSlugs();

    expect(new Set(slugs).size).toBe(slugs.length);

    for (const slug of slugs) {
      const campaign = await getCampaign(slug);
      expect(campaign?.slug).toBe(slug);
    }
  });

  it('returns undefined for an unknown slug so the route can 404', async () => {
    await expect(getCampaign('not-a-campaign')).resolves.toBeUndefined();
    await expect(getEvent('not-an-event')).resolves.toBeUndefined();
    await expect(getNewsArticle('not-an-article')).resolves.toBeUndefined();
  });

  it('covers every event and article exactly once', async () => {
    const { upcoming, past } = await getEventsPage();
    const all = [...upcoming, ...past];
    const slugs = await getEventSlugs();

    expect(new Set(all.map((event) => event.id)).size).toBe(all.length);
    expect(slugs).toHaveLength(all.length);

    const { items } = await getNewsPage();
    const newsSlugs = await getNewsSlugs();

    expect(newsSlugs).toHaveLength(items.length);
    expect(new Set(newsSlugs).size).toBe(items.length);
  });

  it('gives every article a body and every campaign a story', async () => {
    const news = await getNewsPage();

    for (const article of news.items) {
      expect(article.body.length).toBeGreaterThan(0);
    }

    const campaigns = await getCampaignsPage();

    for (const campaign of campaigns.items) {
      expect(campaign.story.length).toBeGreaterThan(0);
      expect(Number.isInteger(campaign.raisedMinor)).toBe(true);
      expect(Number.isInteger(campaign.goalMinor)).toBe(true);
      expect(campaign.raisedMinor).toBeLessThanOrEqual(campaign.goalMinor);
    }
  });

  it('derives filter categories from the data rather than hardcoding them', async () => {
    const news = await getNewsPage();
    const gallery = await getGalleryPage();

    expect(news.categories).toEqual([...new Set(news.items.map((item) => item.category))].sort());
    expect(gallery.categories).toEqual(
      [...new Set(gallery.items.map((item) => item.category))].sort(),
    );
  });

  it('publishes no invented contact details', async () => {
    const contact = await getContactPage();

    expect(contact.channels).toHaveLength(3);

    for (const channel of contact.channels) {
      expect(channel.value).toBe('');
      expect(channel.note.length).toBeGreaterThan(0);
    }

    const serialised = JSON.stringify(contact).toLowerCase();

    for (const forbidden of ['+91', '@gmail', '@.', 'tel:', 'wa.me', 'maps.google', 'pincode']) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it('keeps long-form page copy free of registration and tax claims', async () => {
    const serialised = JSON.stringify([
      await getAboutPage(),
      await getOurWorkPage(),
      await getCampaignsPage(),
      await getEventsPage(),
      await getNewsPage(),
    ]).toLowerCase();

    for (const forbidden of ['80g', '12a', 'registered charity', 'tax exemption', 'gstin']) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it('keeps the organisation name out of page titles', async () => {
    // The root layout's title template appends "| Shri Vanshidhar Gaushala".
    // A page title that repeats it would render the brand twice.
    const pages = [
      await getAboutPage(),
      await getOurWorkPage(),
      await getCampaignsPage(),
      await getEventsPage(),
      await getNewsPage(),
      await getGalleryPage(),
      await getContactPage(),
    ];

    for (const page of pages) {
      expect(page.seo.title).not.toContain(SITE_NAME);
      expect(page.seo.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps composed titles within a sensible length', async () => {
    const pages = [
      await getAboutPage(),
      await getOurWorkPage(),
      await getCampaignsPage(),
      await getEventsPage(),
      await getNewsPage(),
      await getGalleryPage(),
      await getContactPage(),
    ];

    // Page title + " | " + organisation name, kept under ~65 characters.
    for (const page of pages) {
      expect(page.seo.title.length + 3 + SITE_NAME.length).toBeLessThanOrEqual(65);
    }
  });
});
