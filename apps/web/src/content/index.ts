import {
  activitySchema,
  campaignDetailSchema,
  campaignSummarySchema,
  eventSchema,
  galleryAlbumSchema,
  galleryItemSchema,
  homepageSchema,
  newsCategorySchema,
  newsDetailSchema,
  newsSummarySchema,
  pageSchema,
  testimonialSchema,
  type Block,
  type CampaignDetailDto,
  type PageDto,
} from '@gaushala/shared';

import { getOptionalPublicResource, getPublicCollection, getPublicResource, publicQuery } from './api/client';
import {
  campaignStatus,
  mapActivity,
  mapAlbum,
  mapCampaign,
  mapCampaignDetail,
  mapEvent,
  mapGalleryItem,
  mapHomepageActivity,
  mapImpactStat,
  mapNews,
  mapNewsDetail,
  mapTestimonial,
} from './api/map';
import { CAMPAIGNS_PAGE, EVENTS_PAGE, GALLERY_PAGE, NEWS_PAGE, OUR_WORK_PAGE } from './editorial';
import { demoHomepageContent } from './homepage.demo';
import { demoAboutPage, demoContactPage } from './pages.demo';
import {
  demoCampaignsPage,
  demoEventsPage,
  demoGalleryPage,
  demoNewsPage,
  demoOurWorkPage,
  findCampaign,
  findEvent,
  findNews,
} from './pages.demo';

import type {
  AboutPageContent,
  CampaignRecord,
  CampaignsPageContent,
  ContactPageContent,
  EventRecord,
  EventsPageContent,
  GalleryPageContent,
  GalleryRecord,
  NewsPageContent,
  NewsRecord,
  OurWorkPageContent,
} from './library';
import type { HomepageContent } from './homepage';

export type * from './homepage';
export type * from './library';

/**
 * Content loaders.
 *
 * Content comes from the API by default. `CONTENT_SOURCE=demo` opts a developer
 * or preview build into the bundled demonstration dataset, and is **rejected in
 * production** — so a deployment can never render fictional content, and an API
 * failure surfaces as an error state instead of silently substituting demo data.
 *
 * The signatures here are the ones the pages already use; only the source
 * changed, which is why no page component had to be rewritten.
 */

function useDemoContent(): boolean {
  const requested = process.env.CONTENT_SOURCE;

  if (requested !== 'demo') {
    return false;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CONTENT_SOURCE=demo is not permitted in production: public pages must read the database.',
    );
  }

  return true;
}

const API = '/api/v1/public';

function isNotFound(error: unknown): boolean {
  return error instanceof Error && error.name === 'ApiRequestError' && /404/.test(error.message);
}
/* -------------------------------------------------------------------------- */
/* Homepage                                                                   */
/* -------------------------------------------------------------------------- */

type Section = {
  block: Block;
  activities?: unknown;
  news?: unknown;
  events?: unknown;
  campaign?: unknown;
  gallery?: unknown;
  impact?: unknown;
};

function blockOf<T extends Block['type']>(
  sections: readonly { block: Block }[],
  type: T,
): Extract<Block, { type: T }> | undefined {
  const found = sections.find((section) => section.block.type === type);
  return found === undefined ? undefined : (found.block as Extract<Block, { type: T }>);
}

function sectionOf<T extends Block['type']>(sections: readonly Section[], type: T) {
  return sections.find((section) => section.block.type === type);
}

async function loadHomepage(): Promise<HomepageContent> {
  const homepage = await getPublicResource(`${API}/homepage`, homepageSchema, { revalidate: 60 });
  const sections = homepage.sections as unknown as readonly Section[];
  const page = homepage.page;

  const hero = blockOf(sections, 'hero');

  if (hero === undefined) {
    throw new Error(
      'Homepage has no hero section. Publish one before serving the public site.',
    );
  }

  const about = blockOf(sections, 'about_preview');
  const whatWeDo = sectionOf(sections, 'what_we_do');
  const impactSection = sectionOf(sections, 'impact');
  const newsSection = sectionOf(sections, 'latest_news');
  const eventsSection = sectionOf(sections, 'latest_events');
  const gallerySection = sectionOf(sections, 'gallery_preview');
  const campaignSection = sectionOf(sections, 'featured_campaign');

  const testimonials = await getPublicCollection(`${API}/testimonials`, testimonialSchema, {
    revalidate: 60,
  });

  const campaign = (campaignSection?.campaign ?? null) as CampaignDetailDto | null;

  const sectionHeading = (section: Section | undefined, fallback: string): string => {
    const block = section?.block;
    return block !== undefined && 'heading' in block && typeof block.heading === 'string'
      ? block.heading
      : fallback;
  };

  const sectionDescription = (section: Section | undefined): string | undefined => {
    const block = section?.block;
    return block !== undefined && 'description' in block && typeof block.description === 'string'
      ? block.description
      : undefined;
  };

  const impactDescription = sectionDescription(impactSection);
  const activitiesDescription = sectionDescription(whatWeDo);

  return {
    hero: {
      eyebrow: hero.eyebrow ?? page.title,
      heading: hero.heading,
      description: hero.description,
      primaryCta: hero.primaryCta,
      secondaryCta: hero.secondaryCta ?? { label: 'Learn about our work', href: '/our-work' },
      footnote: hero.footnote ?? '',
      image: { label: 'Gaushala photograph' },
    },
    about: {
      eyebrow: 'About the gaushala',
      heading: about?.heading ?? page.title,
      body: about?.body ?? page.paragraphs,
      link: about?.link ?? { label: 'Learn about the gaushala', href: '/about' },
      image: { label: 'Gaushala photograph' },
    },
    activities: {
      intro: {
        eyebrow: 'Our work',
        heading: sectionHeading(whatWeDo, 'Our work'),
        ...(activitiesDescription === undefined ? {} : { description: activitiesDescription }),
      },
      items: ((whatWeDo?.activities as never[] | undefined) ?? []).map((row, index) =>
        mapHomepageActivity(row as never, index),
      ),
    },
    impact: {
      eyebrow: 'Impact',
      heading: sectionHeading(impactSection, 'Impact'),
      ...(impactDescription === undefined ? {} : { description: impactDescription }),
      stats: ((impactSection?.impact as never[] | undefined) ?? []).map((row) =>
        mapImpactStat(row as never),
      ),
      footnote: 'Verified figures carry a reporting period and a source.',
    },
    donateStrip: {
      heading: 'Every contribution reaches the animals.',
      description:
        'Fodder, water, veterinary care and the upkeep of the shelter all depend on regular support.',
      cta: { label: 'Donate', href: '/donate' },
      note: 'Online donations are not open yet.',
    },
    campaigns: {
      eyebrow: 'Campaigns',
      heading: 'Help us meet the need in front of us.',
      description: campaign === null ? '' : campaign.purposeSummary,
      items:
        campaign === null
          ? []
          : [
              {
                id: campaign.id,
                title: campaign.name,
                purpose: campaign.purposeSummary,
                raisedMinor: campaign.raised.amountMinor ?? 0,
                goalMinor: campaign.target.amountMinor ?? 0,
                status: campaignStatus(campaign),
                imageLabel: campaign.cover?.alt ?? 'Campaign photograph',
              },
            ],
      link: { label: 'All campaigns', href: '/campaigns' },
      footnote: '',
    },
    news: {
      eyebrow: 'Newsroom',
      heading: sectionHeading(newsSection, 'Updates from the gaushala'),
      description: '',
      items: ((newsSection?.news as never[] | undefined) ?? []).map((row) => mapNews(row as never)),
      link: { label: 'View all news', href: '/news' },
    },
    events: {
      eyebrow: "What's on",
      heading: sectionHeading(eventsSection, 'Come and see the work'),
      description: '',
      items: ((eventsSection?.events as never[] | undefined) ?? []).map((row) => mapEvent(row as never)),
      link: { label: 'All events', href: '/events' },
    },
    gallery: {
      eyebrow: 'Gallery',
      heading: sectionHeading(gallerySection, 'Life at the gaushala'),
      description: '',
      items: ((gallerySection?.gallery as never[] | undefined) ?? []).map((row) =>
        mapGalleryItem(row as never),
      ),
      link: { label: 'View full gallery', href: '/gallery' },
      footnote: '',
    },
    testimonials: {
      eyebrow: 'Community',
      heading: 'Voices from the community',
      description: '',
      items: testimonials.items.map(mapTestimonial),
      footnote: '',
    },
    finalCta: {
      heading: 'Be part of the care.',
      description:
        'Whether it is a one-time contribution, a monthly commitment or an hour of your time, the animals feel the difference.',
      primary: { label: 'Donate now', href: '/donate' },
      secondary: { label: 'Learn more', href: '/about' },
      note: 'Online donations are not open yet. Nothing on this page processes a payment.',
    },
    seo: {
      title: page.seo.title ?? page.title,
      description: page.seo.description ?? page.summary ?? '',
    },
  };
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return useDemoContent() ? demoHomepageContent : loadHomepage();
}

/* -------------------------------------------------------------------------- */
/* Pages with authored copy                                                   */
/* -------------------------------------------------------------------------- */

/**
 * About and contact copy is authored in code today. A published `pages` row at
 * the same slug overrides the heading and summary; the rest of the page keeps
 * its authored structure. A missing row is not a failure — an API error is.
 */
async function fetchOptionalPage(slug: string): Promise<PageDto | null> {
  return getOptionalPublicResource(`${API}/pages/${slug}`, pageSchema, {
    optional: true,
    revalidate: 300,
  });
}

export async function getAboutPage(): Promise<AboutPageContent> {
  if (useDemoContent()) return demoAboutPage;

  const row = await fetchOptionalPage('about');

  if (row === null) return demoAboutPage;

  return {
    ...demoAboutPage,
    hero: {
      ...demoAboutPage.hero,
      heading: row.title,
      ...(row.summary === null ? {} : { description: row.summary }),
    },
    seo: {
      title: row.seo.title ?? demoAboutPage.seo.title,
      description: row.seo.description ?? demoAboutPage.seo.description,
    },
  };
}

export async function getContactPage(): Promise<ContactPageContent> {
  if (useDemoContent()) return demoContactPage;

  const row = await fetchOptionalPage('contact');

  if (row === null) return demoContactPage;

  return {
    ...demoContactPage,
    hero: {
      ...demoContactPage.hero,
      heading: row.title,
      ...(row.summary === null ? {} : { description: row.summary }),
    },
    seo: {
      title: row.seo.title ?? demoContactPage.seo.title,
      description: row.seo.description ?? demoContactPage.seo.description,
    },
  };
}

export async function getOurWorkPage(): Promise<OurWorkPageContent> {
  if (useDemoContent()) return demoOurWorkPage;

  const activities = await getPublicCollection(
    `${API}/activities${publicQuery({ limit: 12 })}`,
    activitySchema,
    { revalidate: 120 },
  );

  return {
    hero: OUR_WORK_PAGE.hero,
    intro: OUR_WORK_PAGE.intro,
    activities: activities.items.map((row, index) => mapActivity(row, index)),
    cta: OUR_WORK_PAGE.cta,
    seo: OUR_WORK_PAGE.seo,
  };
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export async function getCampaignsPage(): Promise<CampaignsPageContent> {
  if (useDemoContent()) return demoCampaignsPage;

  const page = await getPublicCollection(
    `${API}/campaigns${publicQuery({ limit: 24 })}`,
    campaignSummarySchema,
    { revalidate: 60 },
  );

  return {
    hero: CAMPAIGNS_PAGE.hero,
    note: CAMPAIGNS_PAGE.note,
    items: page.items.map(mapCampaign),
    cta: CAMPAIGNS_PAGE.cta,
    seo: CAMPAIGNS_PAGE.seo,
  };
}

export async function getCampaign(slug: string): Promise<CampaignRecord | undefined> {
  if (useDemoContent()) return findCampaign(slug);

  try {
    const row = await getPublicResource(
      `${API}/campaigns/${encodeURIComponent(slug)}`,
      campaignDetailSchema,
      { revalidate: 60 },
    );

    return mapCampaignDetail(row);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export async function getCampaignSlugs(): Promise<readonly string[]> {
  const page = await getPublicCollection(
    `${API}/campaigns${publicQuery({ limit: 48 })}`,
    campaignSummarySchema,
  );
  return page.items.map((item) => item.slug);
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function getEventsPage(): Promise<EventsPageContent> {
  if (useDemoContent()) return demoEventsPage;

  const [upcoming, past] = await Promise.all([
    getPublicCollection(`${API}/events${publicQuery({ when: 'upcoming', limit: 24 })}`, eventSchema, {
      revalidate: 60,
    }),
    getPublicCollection(`${API}/events${publicQuery({ when: 'past', limit: 24 })}`, eventSchema, {
      revalidate: 60,
    }),
  ]);

  return {
    hero: EVENTS_PAGE.hero,
    note: EVENTS_PAGE.note,
    upcoming: upcoming.items.map(mapEvent),
    past: past.items.map(mapEvent),
    cta: EVENTS_PAGE.cta,
    seo: EVENTS_PAGE.seo,
  };
}

export async function getEvent(slug: string): Promise<EventRecord | undefined> {
  if (useDemoContent()) return findEvent(slug);

  try {
    const row = await getPublicResource(`${API}/events/${encodeURIComponent(slug)}`, eventSchema, {
      revalidate: 60,
    });

    return mapEvent(row);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export async function getEventSlugs(): Promise<readonly string[]> {
  const [upcoming, past] = await Promise.all([
    getPublicCollection(`${API}/events${publicQuery({ when: 'upcoming', limit: 48 })}`, eventSchema),
    getPublicCollection(`${API}/events${publicQuery({ when: 'past', limit: 48 })}`, eventSchema),
  ]);

  return [...upcoming.items, ...past.items].map((item) => item.slug);
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export async function getNewsPage(category?: string): Promise<NewsPageContent> {
  if (useDemoContent()) return demoNewsPage;

  const [items, categories] = await Promise.all([
    getPublicCollection(`${API}/news${publicQuery({ limit: 24, category })}`, newsSummarySchema, {
      revalidate: 60,
    }),
    getPublicResource(`${API}/news/categories`, newsCategorySchema.array(), { revalidate: 300 }),
  ]);

  return {
    hero: NEWS_PAGE.hero,
    note: NEWS_PAGE.note,
    categories: categories.map((entry) => entry.name),
    items: items.items.map(mapNews),
    cta: NEWS_PAGE.cta,
    seo: NEWS_PAGE.seo,
  };
}

export async function getNewsArticle(slug: string): Promise<NewsRecord | undefined> {
  if (useDemoContent()) return findNews(slug);

  try {
    const row = await getPublicResource(
      `${API}/news/${encodeURIComponent(slug)}`,
      newsDetailSchema,
      { revalidate: 60 },
    );

    return mapNewsDetail(row);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export async function getNewsSlugs(): Promise<readonly string[]> {
  const page = await getPublicCollection(
    `${API}/news${publicQuery({ limit: 48 })}`,
    newsSummarySchema,
  );
  return page.items.map((item) => item.slug);
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export async function getGalleryPage(category?: string): Promise<GalleryPageContent> {
  if (useDemoContent()) return demoGalleryPage;

  const [items, albums] = await Promise.all([
    getPublicCollection(`${API}/gallery${publicQuery({ limit: 24, category })}`, galleryItemSchema, {
      revalidate: 60,
    }),
    getPublicResource(`${API}/gallery/albums`, galleryAlbumSchema.array(), { revalidate: 300 }),
  ]);

  return {
    hero: GALLERY_PAGE.hero,
    note: GALLERY_PAGE.note,
    categories: albums.map(mapAlbum),
    items: items.items.map(mapGalleryItem) as GalleryRecord[],
    cta: GALLERY_PAGE.cta,
    seo: GALLERY_PAGE.seo,
  };
}
