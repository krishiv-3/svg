import type { Cta, ImageRef, SectionIntro } from './homepage';

/**
 * Public page content contracts (Phase 5).
 *
 * Same rules as the homepage contract: serialisable data only, money in integer
 * minor units, dates with both a machine value and a display label, and image
 * slots described by a label rather than a stock URL.
 *
 * Detail records are shared between the listing page and the detail page, so a
 * campaign's title or a news article's date is defined exactly once.
 */

/* -------------------------------------------------------------------------- */
/* Page furniture                                                             */
/* -------------------------------------------------------------------------- */

export interface PageHero {
  readonly eyebrow?: string;
  readonly heading: string;
  readonly description: string;
  readonly image?: ImageRef;
}

/** A closing donation prompt reused across the secondary pages. */
export interface CtaPanel {
  readonly heading: string;
  readonly description: string;
  readonly cta: Cta;
  readonly secondary?: Cta;
  readonly note?: string;
}

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export interface AboutValue {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Icon key resolved by the page, never a component in the data. */
  readonly icon: 'heart' | 'leaf' | 'users' | 'check';
}

export interface AboutPageContent {
  readonly hero: PageHero;
  readonly intro: { readonly heading: string; readonly body: readonly string[] };
  readonly story: SectionIntro & { readonly body: readonly string[]; readonly image: ImageRef };
  readonly mission: {
    readonly heading: string;
    readonly body: string;
    readonly points: readonly string[];
  };
  readonly values: {
    readonly heading: string;
    readonly description: string;
    readonly items: readonly AboutValue[];
  };
  readonly care: SectionIntro & { readonly body: readonly string[]; readonly image: ImageRef };
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* Our work                                                                   */
/* -------------------------------------------------------------------------- */

export type WorkIcon = 'nourishment' | 'care' | 'shelter' | 'community';

export interface WorkActivity {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: readonly string[];
  readonly bullets: readonly string[];
  readonly icon: WorkIcon;
  readonly image: ImageRef;
}

export interface OurWorkPageContent {
  readonly hero: PageHero;
  readonly intro: { readonly heading: string; readonly body: readonly string[] };
  readonly activities: readonly WorkActivity[];
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export interface CampaignRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  /** One-line purpose, used on cards. */
  readonly purpose: string;
  readonly summary: string;
  readonly story: readonly string[];
  readonly raisedMinor: number;
  readonly goalMinor: number;
  readonly status: string;
  readonly image: ImageRef;
  readonly startedOn: string;
  readonly updates: readonly {
    readonly dateLabel: string;
    readonly dateTime: string;
    readonly title: string;
    readonly body: string;
  }[];
}

export interface CampaignsPageContent {
  readonly hero: PageHero;
  readonly note: string;
  readonly items: readonly CampaignRecord[];
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export type EventStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';

export interface EventRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly day: string;
  readonly month: string;
  readonly dateTime: string;
  readonly time: string;
  readonly venue: string;
  readonly status: EventStatus;
  readonly summary: string;
  readonly description: readonly string[];
  readonly image: ImageRef;
  /** Only present when the organisation has supplied it. */
  readonly registration?: {
    readonly label: string;
    readonly detail: string;
  };
}

export interface EventsPageContent {
  readonly hero: PageHero;
  readonly note: string;
  readonly upcoming: readonly EventRecord[];
  readonly past: readonly EventRecord[];
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export interface NewsRecord {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly category: string;
  readonly dateLabel: string;
  readonly dateTime: string;
  readonly body: readonly string[];
  readonly image: ImageRef;
}

export interface NewsPageContent {
  readonly hero: PageHero;
  readonly note: string;
  readonly categories: readonly string[];
  readonly items: readonly NewsRecord[];
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export interface GalleryRecord {
  readonly id: string;
  readonly caption: string;
  readonly category: string;
  readonly image: ImageRef;
}

export interface GalleryPageContent {
  readonly hero: PageHero;
  readonly note: string;
  readonly categories: readonly string[];
  readonly items: readonly GalleryRecord[];
  readonly cta: CtaPanel;
  readonly seo: { readonly title: string; readonly description: string };
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export interface ContactChannel {
  readonly id: string;
  readonly label: string;
  /** Empty until the organisation confirms the detail. */
  readonly value: string;
  readonly note: string;
  readonly icon: 'map' | 'phone' | 'mail';
}

export interface ContactPageContent {
  readonly hero: PageHero;
  readonly intro: string;
  readonly notice: string;
  readonly channels: readonly ContactChannel[];
  readonly mapNote: string;
  readonly seo: { readonly title: string; readonly description: string };
}
