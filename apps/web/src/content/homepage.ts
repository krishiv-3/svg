/**
 * Homepage content contract.
 *
 * These interfaces are the boundary between the CMS and the presentation layer.
 * Every homepage section receives plain serialisable data, so when the API and
 * CMS arrive (Phase 6) only `getHomepageContent()` changes — not a single
 * component.
 *
 * Rules:
 *  - no React nodes, class names or component types in here;
 *  - money is integer minor units (paise), never a pre-formatted string;
 *  - dates carry both a machine value (`dateTime`) and a display label, so the
 *    server can localise later without changing the components;
 *  - every image has a `label` describing the intended photograph, because the
 *    organisation has not supplied licensed photography yet.
 */

/** A navigation target used by any call to action. */
export interface Cta {
  readonly label: string;
  readonly href: string;
}

/**
 * An image slot. `src`/`alt` stay empty until an approved photograph exists;
 * the UI then renders a clearly labelled placeholder instead of stock imagery.
 */
export interface ImageRef {
  /** Human description of the intended photograph, e.g. "Cows in the shade". */
  readonly label: string;
  readonly src?: string;
  readonly alt?: string;
}

export interface SectionIntro {
  readonly eyebrow?: string;
  readonly heading: string;
  readonly description?: string;
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export interface HomepageHero {
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly primaryCta: Cta;
  readonly secondaryCta: Cta;
  /** Small print under the actions, e.g. the preview notice. */
  readonly footnote: string;
  readonly image: ImageRef;
  /**
   * Optional floating glass panel. Only ever populated with a verified figure,
   * so no invented statistic can reach the public hero.
   */
  readonly aside?: { readonly label: string; readonly value: string; readonly note?: string };
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export interface HomepageAbout extends SectionIntro {
  readonly body: readonly string[];
  readonly link: Cta;
  readonly image: ImageRef;
  /** Short supporting statements shown beside the image. */
  readonly points?: readonly string[];
}

/* -------------------------------------------------------------------------- */
/* Activities                                                                 */
/* -------------------------------------------------------------------------- */

export type HomepageActivityIcon = 'nourishment' | 'care' | 'shelter' | 'community';

export interface HomepageActivity {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly bullets: readonly string[];
  readonly icon: HomepageActivityIcon;
  readonly link: Cta;
}

export interface HomepageActivities {
  readonly intro: SectionIntro;
  readonly items: readonly HomepageActivity[];
}

/* -------------------------------------------------------------------------- */
/* Impact                                                                     */
/* -------------------------------------------------------------------------- */

export interface HomepageImpactStat {
  readonly id: string;
  readonly value: string;
  readonly unit?: string;
  readonly label: string;
  /** Reporting period or evidence note; required so a figure is never bare. */
  readonly note: string;
}

export interface HomepageImpact extends SectionIntro {
  readonly stats: readonly HomepageImpactStat[];
  readonly footnote: string;
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export interface HomepageCampaign {
  readonly id: string;
  readonly title: string;
  readonly purpose: string;
  /** Raised amount in minor units (paise). */
  readonly raisedMinor: number;
  /** Goal amount in minor units (paise); 0 means no target is published. */
  readonly goalMinor: number;
  readonly status: string;
  readonly imageLabel: string;
}

export interface HomepageCampaigns extends SectionIntro {
  readonly items: readonly HomepageCampaign[];
  readonly link: Cta;
  readonly footnote: string;
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export interface HomepageNewsItem {
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: string;
  readonly dateLabel: string;
  /** ISO date for `<time datetime>`. */
  readonly dateTime: string;
}

export interface HomepageNews extends SectionIntro {
  readonly items: readonly HomepageNewsItem[];
  readonly link: Cta;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export type HomepageEventStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export interface HomepageEventItem {
  readonly id: string;
  readonly title: string;
  readonly day: string;
  readonly month: string;
  readonly dateTime: string;
  readonly time: string;
  /** Only populated once the venue is verified with the organisation. */
  readonly venue: string;
  readonly status: HomepageEventStatus;
}

export interface HomepageEvents extends SectionIntro {
  readonly items: readonly HomepageEventItem[];
  readonly link: Cta;
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export interface HomepageGalleryItem {
  readonly id: string;
  readonly caption: string;
  readonly category: string;
  readonly image: ImageRef;
}

export interface HomepageGallery extends SectionIntro {
  readonly items: readonly HomepageGalleryItem[];
  readonly link: Cta;
  readonly footnote: string;
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export interface HomepageTestimonial {
  readonly id: string;
  readonly quote: string;
  readonly name: string;
  /** Role or context — only when verified by the organisation. */
  readonly context?: string;
}

export interface HomepageTestimonials extends SectionIntro {
  readonly items: readonly HomepageTestimonial[];
  readonly footnote: string;
}

/* -------------------------------------------------------------------------- */
/* Calls to action                                                            */
/* -------------------------------------------------------------------------- */

export interface HomepageDonateStrip {
  readonly heading: string;
  readonly description: string;
  readonly cta: Cta;
  readonly note: string;
}

export interface HomepageFinalCta {
  readonly heading: string;
  readonly description: string;
  readonly primary: Cta;
  readonly secondary: Cta;
  readonly note: string;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export interface HomepageSeo {
  readonly title: string;
  readonly description: string;
}

/** Everything the homepage renders, in document order. */
export interface HomepageContent {
  readonly hero: HomepageHero;
  readonly about: HomepageAbout;
  readonly activities: HomepageActivities;
  readonly impact: HomepageImpact;
  readonly donateStrip: HomepageDonateStrip;
  readonly campaigns: HomepageCampaigns;
  readonly news: HomepageNews;
  readonly events: HomepageEvents;
  readonly gallery: HomepageGallery;
  readonly testimonials: HomepageTestimonials;
  readonly finalCta: HomepageFinalCta;
  readonly seo: HomepageSeo;
}
