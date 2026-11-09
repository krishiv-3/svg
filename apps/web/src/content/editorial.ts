import type { Cta } from '@/content/homepage';
import type { PageHero } from '@/content/library';

/**
 * Page chrome for the database-backed pages.
 *
 * These are the site's own navigational labels and section headings — not
 * records, and not demonstration data. Anything that could be a factual claim
 * (campaigns, events, articles, figures, testimonials) comes from the database.
 * When the CMS lands, this file is replaced by authored `pages` rows.
 */

interface ListingChrome {
  readonly hero: PageHero;
  readonly note: string;
  readonly cta: {
    readonly heading: string;
    readonly description: string;
    readonly cta: Cta;
    readonly secondary?: Cta;
    readonly note?: string;
  };
  readonly seo: { readonly title: string; readonly description: string };
}

export const CAMPAIGNS_PAGE: ListingChrome = {
  hero: {
    eyebrow: 'Campaigns',
    heading: 'Support a specific, time-bound purpose.',
    description:
      'Campaigns exist for work that needs funding now, rather than the routine costs of the day.',
  },
  note: 'Campaign progress is reported from recorded amounts. Online donations are not open yet.',
  cta: {
    heading: 'Not sure which to choose?',
    description:
      'General donations support whatever the herd needs most that week, which is often the most useful kind of help.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'Campaigns',
    description: 'Current gaushala campaigns with progress against their targets.',
  },
};

export const EVENTS_PAGE: ListingChrome = {
  hero: {
    eyebrow: "What's on",
    heading: 'Come and see the work.',
    description:
      'Visits and volunteer mornings are arranged in advance so the animals are never disturbed.',
  },
  note: 'Dates and venues are published by the gaushala. Registration opens only when it is confirmed.',
  cta: {
    heading: 'Rather help from a distance?',
    description: 'Support goes directly to fodder, water, veterinary care and shelter upkeep.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'Events',
    description: 'Open days, volunteer mornings and workshops at the gaushala.',
  },
};

export const NEWS_PAGE: ListingChrome = {
  hero: {
    eyebrow: 'Newsroom',
    heading: 'Updates from the gaushala.',
    description: 'Announcements, notes from the care team and progress on current work.',
  },
  note: 'Articles are published by the gaushala.',
  cta: {
    heading: 'Support the work behind the updates.',
    description: 'Every article describes work that depends on regular support.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'News',
    description: 'Announcements and notes from the gaushala.',
  },
};

export const GALLERY_PAGE: ListingChrome = {
  hero: {
    eyebrow: 'Gallery',
    heading: 'Life at the gaushala.',
    description:
      'Photographs are supplied by the organisation and published only once consent and credit are settled.',
  },
  note: 'Photographs are published by the gaushala.',
  cta: {
    heading: 'See it in person.',
    description: 'Guided visits are arranged in advance, in small groups.',
    cta: { label: 'Contact us', href: '/contact' },
    secondary: { label: 'Donate', href: '/donate' },
  },
  seo: {
    title: 'Gallery',
    description: 'Photographs from the gaushala.',
  },
};

export const OUR_WORK_PAGE = {
  hero: {
    eyebrow: 'Our work',
    heading: 'The work is the routine.',
    description: 'Four areas of work, repeated daily: nourishment, health, shelter and community.',
  },
  intro: {
    heading: 'How the work is organised',
    body: [
      'Every day follows the same order: observe, feed, water, clean, check, and record anything that needs following up.',
      'The sections below describe each area of that routine.',
    ],
  },
  cta: CAMPAIGNS_PAGE.cta,
  seo: {
    title: 'Our work',
    description: 'Daily nourishment, health and wellbeing, shelter and community involvement.',
  },
};
