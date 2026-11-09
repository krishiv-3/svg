/**
 * DEMONSTRATION CONTENT — DEVELOPMENT ONLY.
 *
 * Every record in this module is fictional and exists solely so the design
 * system can be evaluated with realistic layouts. None of it describes Shri
 * Vanshidhar Gaushala, and none of it may appear on a production page.
 *
 * Safeguards (see docs/DESIGN_SYSTEM.md §11):
 *  1. This module lives in the web app, not the API. There is no database
 *     column, seed record or endpoint that can serve it.
 *  2. Only the `/design-system` reference routes import it. A unit test fails
 *     the build if any other route imports from `@/demo`.
 *  3. Every record carries `isDemo: true` and the shared notice, and everything
 *     rendered from it is wrapped in a visible DEMO marker.
 *  4. The API seed (`apps/api/prisma/seed.ts`) contains no demo records; a test
 *     asserts that.
 *
 * When the organisation supplies real content it replaces this module through
 * the CMS — the components themselves need no redesign.
 */

export const DEMO_NOTICE =
  'Demonstration content — illustrative only, not a verified claim about Shri Vanshidhar Gaushala.';

export const DEMO_CONTENT_VERSION = '2026-11-06.1';

/** Every demo record carries this shape, so the marker cannot be forgotten. */
export interface DemoRecord {
  readonly isDemo: true;
  readonly demoNotice: string;
}

const demoFields = { isDemo: true, demoNotice: DEMO_NOTICE } as const;

/* -------------------------------------------------------------------------- */
/* Hero and introduction                                                      */
/* -------------------------------------------------------------------------- */

export interface DemoHero extends DemoRecord {
  readonly heading: string;
  readonly description: string;
  readonly primaryCta: { readonly label: string; readonly href: string };
  readonly secondaryCta: { readonly label: string; readonly href: string };
}

export const DEMO_HERO: DemoHero = {
  ...demoFields,
  heading: 'Compassion Begins With Care.',
  description: 'Every cow deserves kindness, nourishment and a safe place to live.',
  primaryCta: { label: 'Donate', href: '/donate' },
  secondaryCta: { label: 'Learn about our work', href: '/our-work' },
};

export interface DemoIntroduction extends DemoRecord {
  readonly eyebrow: string;
  readonly heading: string;
  readonly body: string;
}

export const DEMO_INTRODUCTION: DemoIntroduction = {
  ...demoFields,
  eyebrow: 'Who we are',
  heading: 'A calm place, cared for every day',
  body: 'A short introduction would sit here, explaining the organisation’s purpose in the organisation’s own words. It is deliberately left as illustrative copy until approved text is supplied.',
};

/* -------------------------------------------------------------------------- */
/* Activities                                                                 */
/* -------------------------------------------------------------------------- */

export type DemoActivityIcon = 'nourishment' | 'care' | 'shelter' | 'community';

export interface DemoActivity extends DemoRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: DemoActivityIcon;
}

export const DEMO_ACTIVITIES: readonly DemoActivity[] = [
  {
    ...demoFields,
    id: 'daily-nourishment',
    title: 'Daily Nourishment',
    description: 'Fresh fodder, clean water and a balanced routine, every single day of the year.',
    icon: 'nourishment',
  },
  {
    ...demoFields,
    id: 'care-and-wellbeing',
    title: 'Care and Wellbeing',
    description:
      'Regular health checks and a quiet place to recover, with careful attention to each animal.',
    icon: 'care',
  },
  {
    ...demoFields,
    id: 'safe-shelter',
    title: 'Safe Shelter',
    description:
      'Shade in summer, warmth in winter, and a calm environment designed around the animals.',
    icon: 'shelter',
  },
  {
    ...demoFields,
    id: 'community-support',
    title: 'Community Support',
    description:
      'Visits, volunteering and learning, so the local community can take part in the work.',
    icon: 'community',
  },
];

/* -------------------------------------------------------------------------- */
/* Impact statistics                                                          */
/* -------------------------------------------------------------------------- */

export interface DemoStatistic extends DemoRecord {
  readonly id: string;
  readonly value: string;
  readonly unit?: string;
  readonly label: string;
  readonly note: string;
}

const DEMO_FIGURE_NOTE = 'Illustrative figure — replaced by a verified, dated statistic.';

export const DEMO_STATISTICS: readonly DemoStatistic[] = [
  {
    ...demoFields,
    id: 'cows',
    value: '120',
    unit: 'cows',
    label: 'Under daily care',
    note: DEMO_FIGURE_NOTE,
  },
  {
    ...demoFields,
    id: 'days',
    value: '365',
    unit: 'days',
    label: 'Of feeding, every year',
    note: DEMO_FIGURE_NOTE,
  },
  {
    ...demoFields,
    id: 'programmes',
    value: '4',
    unit: 'programmes',
    label: 'Across the gaushala',
    note: DEMO_FIGURE_NOTE,
  },
  {
    ...demoFields,
    id: 'volunteers',
    value: '18',
    unit: 'people',
    label: 'Volunteering each month',
    note: DEMO_FIGURE_NOTE,
  },
];

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export interface DemoCampaign extends DemoRecord {
  readonly id: string;
  readonly title: string;
  readonly purpose: string;
  /** Minor units (paise), matching the API money contract. */
  readonly raisedMinor: number;
  readonly goalMinor: number;
  readonly status: string;
  readonly imageLabel: string;
}

export const DEMO_CAMPAIGNS: readonly DemoCampaign[] = [
  {
    ...demoFields,
    id: 'winter-fodder',
    title: 'Winter Fodder Fund',
    purpose: 'Nutritious fodder through the coldest months, when grazing is scarce.',
    raisedMinor: 18_000_000,
    goalMinor: 50_000_000,
    status: 'Illustrative',
    imageLabel: 'Demo photograph — fodder being prepared',
  },
  {
    ...demoFields,
    id: 'shelter-repairs',
    title: 'Shelter Repair Appeal',
    purpose: 'Repairs to the shaded resting area before the summer heat arrives.',
    raisedMinor: 7_500_000,
    goalMinor: 20_000_000,
    status: 'Illustrative',
    imageLabel: 'Demo photograph — shelter courtyard',
  },
];

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export interface DemoEvent extends DemoRecord {
  readonly id: string;
  readonly title: string;
  readonly day: string;
  readonly month: string;
  readonly dateTime: string;
  readonly time: string;
  readonly venue: string;
  readonly status: 'Scheduled' | 'Completed';
}

export const DEMO_EVENTS: readonly DemoEvent[] = [
  {
    ...demoFields,
    id: 'open-day',
    title: 'Community Open Day',
    day: '14',
    month: 'Dec',
    dateTime: '2026-12-14T10:00:00+05:30',
    time: '10:00 – 16:00',
    venue: 'Gaushala grounds (demonstration venue)',
    status: 'Scheduled',
  },
  {
    ...demoFields,
    id: 'volunteer-morning',
    title: 'Volunteer Morning',
    day: '21',
    month: 'Dec',
    dateTime: '2026-12-21T08:00:00+05:30',
    time: '08:00 – 11:00',
    venue: 'Meet at the main gate (demonstration venue)',
    status: 'Scheduled',
  },
  {
    ...demoFields,
    id: 'care-workshop',
    title: 'Winter Care Workshop',
    day: '10',
    month: 'Jan',
    dateTime: '2027-01-10T11:00:00+05:30',
    time: '11:00 – 13:00',
    venue: 'Community hall (demonstration venue)',
    status: 'Scheduled',
  },
];

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export interface DemoNews extends DemoRecord {
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: string;
  readonly dateLabel: string;
  readonly dateTime: string;
}

export const DEMO_NEWS: readonly DemoNews[] = [
  {
    ...demoFields,
    id: 'winter-preparations',
    title: 'Preparing the shelters for winter',
    excerpt:
      'An illustrative update describing seasonal preparation work, with a photograph and a short explanation.',
    category: 'Updates',
    dateLabel: '2 November 2026',
    dateTime: '2026-11-02',
  },
  {
    ...demoFields,
    id: 'morning-with-care-team',
    title: 'A morning with the care team',
    excerpt: 'Illustrative copy showing how a photo-led article would read on the website.',
    category: 'Stories',
    dateLabel: '14 October 2026',
    dateTime: '2026-10-14',
  },
  {
    ...demoFields,
    id: 'activity-programme',
    title: 'Introducing a new activity programme',
    excerpt:
      'Illustrative announcement copy. Real announcements are written and published through the CMS.',
    category: 'Announcements',
    dateLabel: '30 September 2026',
    dateTime: '2026-09-30',
  },
];

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export interface DemoGalleryItem extends DemoRecord {
  readonly id: string;
  readonly caption: string;
  readonly category: string;
}

export const DEMO_GALLERY: readonly DemoGalleryItem[] = [
  { ...demoFields, id: 'g1', caption: 'Morning feeding', category: 'Daily care' },
  { ...demoFields, id: 'g2', caption: 'Shelter courtyard', category: 'Facilities' },
  { ...demoFields, id: 'g3', caption: 'Health check', category: 'Care' },
  { ...demoFields, id: 'g4', caption: 'Volunteers at work', category: 'Community' },
  { ...demoFields, id: 'g5', caption: 'Fresh fodder', category: 'Daily care' },
  { ...demoFields, id: 'g6', caption: 'A quiet afternoon', category: 'Facilities' },
];

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export interface DemoTestimonial extends DemoRecord {
  readonly id: string;
  readonly quote: string;
  readonly name: string;
  readonly context: string;
}

export const DEMO_TESTIMONIALS: readonly DemoTestimonial[] = [
  {
    ...demoFields,
    id: 't1',
    quote:
      'This is illustrative testimonial text used only to show the layout. It is not a real quotation and no consent has been recorded.',
    name: 'Demo supporter',
    context: 'Illustrative — not a real person',
  },
  {
    ...demoFields,
    id: 't2',
    quote:
      'A second example so the grid can be evaluated with more than one card. Replace with approved, consented quotations.',
    name: 'Demo volunteer',
    context: 'Illustrative — not a real person',
  },
  {
    ...demoFields,
    id: 't3',
    quote: 'Testimonials must never be published without recorded consent and an approved source.',
    name: 'Demo visitor',
    context: 'Illustrative — not a real person',
  },
];

/* -------------------------------------------------------------------------- */
/* Contact and SEO                                                            */
/* -------------------------------------------------------------------------- */

export interface DemoContact extends DemoRecord {
  readonly heading: string;
  readonly note: string;
  /** Deliberately empty: no address, phone number or email is invented. */
  readonly lines: readonly { readonly label: string; readonly value: string }[];
}

export const DEMO_CONTACT: DemoContact = {
  ...demoFields,
  heading: 'Visit or contact us',
  note: 'Address, phone number, email and visiting hours are published only after the organisation verifies them.',
  lines: [],
};

export interface DemoSeoEntry extends DemoRecord {
  readonly route: string;
  readonly title: string;
  readonly description: string;
}

/** Illustrative metadata shapes for future public routes (Phase 4–5). */
export const DEMO_SEO: readonly DemoSeoEntry[] = [
  {
    ...demoFields,
    route: '/',
    title: 'Shri Vanshidhar Gaushala — (demo title)',
    description:
      'Illustrative meta description for the homepage; the real one is written from approved content.',
  },
  {
    ...demoFields,
    route: '/campaigns/:slug',
    title: 'Campaign name — Shri Vanshidhar Gaushala (demo)',
    description: 'Illustrative campaign meta description using the purpose summary and target.',
  },
  {
    ...demoFields,
    route: '/news/:slug',
    title: 'Article title — Shri Vanshidhar Gaushala (demo)',
    description: 'Illustrative article meta description, generated from the article excerpt.',
  },
];

/* -------------------------------------------------------------------------- */
/* Aggregate                                                                  */
/* -------------------------------------------------------------------------- */

/** Every demo record, for the safety tests. */
export const ALL_DEMO_RECORDS: readonly DemoRecord[] = [
  DEMO_HERO,
  DEMO_INTRODUCTION,
  ...DEMO_ACTIVITIES,
  ...DEMO_STATISTICS,
  ...DEMO_CAMPAIGNS,
  ...DEMO_EVENTS,
  ...DEMO_NEWS,
  ...DEMO_GALLERY,
  ...DEMO_TESTIMONIALS,
  DEMO_CONTACT,
  ...DEMO_SEO,
];
