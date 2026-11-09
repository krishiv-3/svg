import {
  CAMPAIGN_SLUGS,
  CAMPAIGN_STORY,
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_NEWS,
  EVENT_DETAIL,
  EVENT_SLUGS,
  NEWS_BODY,
  NEWS_SLUGS,
} from './demo-source';

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
  WorkActivity,
} from './library';

/**
 * Demonstration content for the Phase 5 public pages.
 *
 * Everything here is illustrative. No history, registration, achievement,
 * address, phone number, email address or real fundraising total is invented;
 * where such a value would normally live, the content says it is pending.
 */

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export const demoAboutPage: AboutPageContent = {
  hero: {
    eyebrow: 'About',
    heading: 'A gaushala is a daily practice, not a single act.',
    description:
      'Shelter, nourishment and care, repeated every day. This page will carry the organisation’s own history and people once they are documented.',
  },
  intro: {
    heading: 'Why a gaushala exists',
    body: [
      'A gaushala is built around a simple obligation: an animal that cannot fend for itself is looked after, not abandoned. That obligation is unglamorous and constant.',
      'What follows describes the shape of that work — how care is organised, what it asks of the people doing it, and what it requires from the community around it.',
      'The organisation’s verified history, founding and governance will replace this text before launch.',
    ],
  },
  story: {
    eyebrow: 'Our story',
    heading: 'A history still to be written down',
    description:
      'This section is reserved for the gaushala’s documented history. It is deliberately empty of claims rather than filled with plausible-sounding dates.',
    body: [
      'No founding date, registration number or milestone is published here. Presenting an invented history would be worse than presenting none.',
      'When the organisation supplies verified records — founding, land, governance and milestones — they will appear here as a dated narrative with sources.',
    ],
    image: { label: 'Archive photograph — the gaushala site' },
  },
  mission: {
    heading: 'Mission and vision',
    body: 'The mission describes what the gaushala does every day; the vision describes what it is working towards.',
    points: [
      'Mission: provide consistent nourishment, health care and shelter to the animals in its care.',
      'Vision: a community that treats animal welfare as a shared, ordinary responsibility.',
      'Practice: decide by what the animal needs, not by what is easiest to show.',
    ],
  },
  values: {
    heading: 'Core values',
    description:
      'Four commitments that shape how decisions are made, including the difficult ones.',
    items: [
      {
        id: 'care',
        title: 'Care first',
        description:
          'The animals’ needs set the schedule. Visits, events and photographs work around them, never the reverse.',
        icon: 'heart',
      },
      {
        id: 'steadiness',
        title: 'Steadiness',
        description:
          'Feeding, water and health checks happen every day, including the days nobody is watching.',
        icon: 'check',
      },
      {
        id: 'openness',
        title: 'Openness',
        description:
          'Figures are published with a period and a source, or they are not published at all.',
        icon: 'leaf',
      },
      {
        id: 'community',
        title: 'Community',
        description:
          'The gaushala belongs to the people around it. Volunteers, visitors and neighbours are part of the work.',
        icon: 'users',
      },
    ],
  },
  care: {
    eyebrow: 'Animal welfare',
    heading: 'Care shaped around the animal',
    description: 'What good care looks like in practice, before any photograph is taken.',
    body: [
      'Observation comes before intervention. The first task each day is noticing: who is eating, who is quiet, who is standing differently.',
      'A calm environment matters as much as food. Shade, dry flooring, space to withdraw and a predictable routine do more for an animal’s condition than any single treatment.',
      'Veterinary care is arranged when it is needed and recorded when it happens. None of these details are published yet because none have been verified.',
    ],
    image: { label: 'Care team photograph — morning checks' },
  },
  cta: {
    heading: 'Support the daily work.',
    description:
      'Fodder, water, veterinary care and shelter upkeep are ongoing costs, not one-off projects.',
    cta: { label: 'Donate', href: '/donate' },
    secondary: { label: 'See our work', href: '/our-work' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'About (demo)',
    description:
      'About the gaushala: mission, values and approach to animal care. Preview build — demonstration content, not yet verified.',
  },
};

/* -------------------------------------------------------------------------- */
/* Our work                                                                   */
/* -------------------------------------------------------------------------- */

const WORK_DETAIL: Record<
  string,
  { slug: string; body: readonly string[]; bullets: readonly string[] }
> = {
  nourishment: {
    slug: 'daily-nourishment',
    body: [
      'Feeding is the spine of the day. Quantities are set per animal and adjusted with the season, the animal’s condition and what the veterinarian advises.',
      'Water is checked more often than it is mentioned. Clean water, available at all times, prevents more problems than any supplement.',
    ],
    bullets: ['Balanced daily feed', 'Clean water, checked often', 'Seasonal adjustments'],
  },
  care: {
    slug: 'health-and-wellbeing',
    body: [
      'Health work begins with observation, not medicine. Animals are checked daily, and anything unusual is looked at properly rather than waited out.',
      'Recovery needs quiet. A separate space allows an animal to be monitored without competing for feed or space.',
    ],
    bullets: ['Routine health checks', 'Quiet recovery space', 'Individual attention'],
  },
  shelter: {
    slug: 'shelter-and-facilities',
    body: [
      'Shelter is measured in boring details: dry floors, shade that actually blocks heat, ventilation that moves air, and drainage that keeps water away from where animals rest.',
      'Maintenance is continuous and scheduled around the herd, in sections, so the animals are never displaced all at once.',
    ],
    bullets: ['Shade and ventilation', 'Warmth through winter', 'Safe, dry flooring'],
  },
  community: {
    slug: 'community-involvement',
    body: [
      'The gaushala is not a closed site. Guided visits, volunteer mornings and short learning sessions let the community take part rather than simply observe.',
      'Visits are arranged in advance and kept small, because a steady stream of strangers is stressful for the animals.',
    ],
    bullets: ['Guided visits by arrangement', 'Volunteer mornings', 'Learning sessions'],
  },
};

export const demoOurWorkPage: OurWorkPageContent = {
  hero: {
    eyebrow: 'Our work',
    heading: 'The work is the routine.',
    description:
      'Four areas of work, repeated daily. Each one is described here as it will be practised, pending the organisation’s verified operational detail.',
  },
  intro: {
    heading: 'How the work is organised',
    body: [
      'Every day follows the same order: observe, feed, water, clean, check, and record anything that needs following up. The order is not incidental — observation before feeding means problems are noticed early.',
      'The sections below describe each area of that routine. They are illustrative until the organisation documents its own practice.',
    ],
  },
  activities: DEMO_ACTIVITIES.map((activity): WorkActivity => {
    const detail = WORK_DETAIL[activity.icon];

    return {
      id: activity.id,
      slug: detail?.slug ?? activity.id,
      title: activity.title,
      summary: activity.description,
      body: detail?.body ?? [activity.description],
      bullets: detail?.bullets ?? [],
      icon: activity.icon,
      image: { label: `${activity.title} — photograph` },
    };
  }),
  cta: {
    heading: 'Help keep the routine running.',
    description: 'Regular support is what makes a daily routine possible.',
    cta: { label: 'Donate', href: '/donate' },
    secondary: { label: 'Support a campaign', href: '/campaigns' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'Our work (demo)',
    description:
      'Daily nourishment, health and wellbeing, shelter and community involvement at the gaushala. Demonstration content.',
  },
};

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

const CAMPAIGN_META: Record<string, { startedOn: string; updates: CampaignRecord['updates'] }> = {
  'winter-fodder-fund': {
    startedOn: '2026-10-01',
    updates: [
      {
        dateLabel: '20 October 2026',
        dateTime: '2026-10-20',
        title: 'Storage prepared',
        body: 'Demonstration update: the dry store was cleared and inspected ahead of the first bulk delivery.',
      },
    ],
  },
  'shelter-repair-appeal': {
    startedOn: '2026-10-12',
    updates: [
      {
        dateLabel: '2 November 2026',
        dateTime: '2026-11-02',
        title: 'First section completed',
        body: 'Demonstration update: flooring in the eastern section was replaced and the area returned to use.',
      },
    ],
  },
};

const campaignRecords: CampaignRecord[] = DEMO_CAMPAIGNS.map((campaign, index) => {
  const slug = CAMPAIGN_SLUGS[index] ?? campaign.id;
  const meta = CAMPAIGN_META[slug];

  return {
    id: campaign.id,
    slug,
    title: campaign.title,
    purpose: campaign.purpose,
    summary: campaign.purpose,
    story: CAMPAIGN_STORY[slug] ?? [campaign.purpose],
    raisedMinor: campaign.raisedMinor,
    goalMinor: campaign.goalMinor,
    status: campaign.status,
    image: { label: campaign.imageLabel },
    startedOn: meta?.startedOn ?? '2026-10-01',
    updates: meta?.updates ?? [],
  };
});

export const demoCampaignsPage: CampaignsPageContent = {
  hero: {
    eyebrow: 'Campaigns',
    heading: 'Support a specific, time-bound purpose.',
    description:
      'Campaigns exist for work that needs funding now, rather than the routine costs of the day. Progress is calculated from recorded amounts, never typed by hand.',
  },
  note: 'The amounts are illustrative and no donations are being collected.',
  items: campaignRecords,
  cta: {
    heading: 'Not sure which to choose?',
    description:
      'General donations support whatever the herd needs most that week, which is often the most useful kind of help.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'Campaigns (demo)',
    description:
      'Current gaushala campaigns with progress against their targets. Demonstration content — no donations are being collected.',
  },
};

export function findCampaign(slug: string): CampaignRecord | undefined {
  return campaignRecords.find((campaign) => campaign.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

const eventRecords: EventRecord[] = DEMO_EVENTS.map((event, index) => {
  const slug = EVENT_SLUGS[index] ?? event.id;

  return {
    id: event.id,
    slug,
    title: event.title,
    day: event.day,
    month: event.month,
    dateTime: event.dateTime,
    time: event.time,
    venue: event.venue,
    status: event.status,
    summary: `${event.title} at the gaushala — demonstration event.`,
    description: EVENT_DETAIL[slug] ?? [],
    image: { label: `${event.title} — event photograph` },
  };
});

export const demoEventsPage: EventsPageContent = {
  hero: {
    eyebrow: "What's on",
    heading: 'Come and see the work.',
    description:
      'Visits and volunteer mornings are arranged in advance so the animals are never disturbed. Dates below are demonstration entries.',
  },
  note: 'Dates, times and venues are fictional and registration is not open.',
  upcoming: eventRecords.filter((event) => event.status === 'Scheduled'),
  past: eventRecords.filter((event) => event.status !== 'Scheduled'),
  cta: {
    heading: 'Rather help from a distance?',
    description: 'Support goes directly to fodder, water, veterinary care and shelter upkeep.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'Events (demo)',
    description:
      'Open days, volunteer mornings and workshops at the gaushala. Demonstration content — dates are fictional.',
  },
};

export function findEvent(slug: string): EventRecord | undefined {
  return eventRecords.find((event) => event.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

const newsRecords: NewsRecord[] = DEMO_NEWS.map((article, index) => {
  const slug = NEWS_SLUGS[index] ?? article.id;

  return {
    id: article.id,
    slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    dateLabel: article.dateLabel,
    dateTime: article.dateTime,
    body: NEWS_BODY[slug] ?? [article.excerpt],
    image: { label: 'Article cover photograph' },
  };
});

const newsCategories = [...new Set(newsRecords.map((article) => article.category))].sort();

export const demoNewsPage: NewsPageContent = {
  hero: {
    eyebrow: 'Newsroom',
    heading: 'Updates from the gaushala.',
    description:
      'Announcements, notes from the care team and progress on current work. Demonstration articles show how the reading experience will work.',
  },
  note: 'The text is illustrative and not a record of real events.',
  categories: newsCategories,
  items: newsRecords,
  cta: {
    heading: 'Support the work behind the updates.',
    description: 'Every article describes work that depends on regular support.',
    cta: { label: 'Donate', href: '/donate' },
    note: 'Online donations are not open yet.',
  },
  seo: {
    title: 'News (demo)',
    description: 'Announcements and notes from the gaushala. Demonstration articles.',
  },
};

export function findNews(slug: string): NewsRecord | undefined {
  return newsRecords.find((article) => article.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

const galleryRecords: GalleryRecord[] = DEMO_GALLERY.map((item) => ({
  id: item.id,
  caption: item.caption,
  category: item.category,
  image: { label: item.caption },
}));

const galleryCategories = [...new Set(galleryRecords.map((item) => item.category))].sort();

export const demoGalleryPage: GalleryPageContent = {
  hero: {
    eyebrow: 'Gallery',
    heading: 'Life at the gaushala.',
    description:
      'Photographs are supplied by the organisation and published only once consent and credit are settled. Until then, every tile is a labelled placeholder.',
  },
  note: 'No stock photography is used anywhere on this site.',
  categories: galleryCategories,
  items: galleryRecords,
  cta: {
    heading: 'See it in person.',
    description: 'Guided visits are arranged in advance, in small groups.',
    cta: { label: 'Contact us', href: '/contact' },
    secondary: { label: 'Donate', href: '/donate' },
  },
  seo: {
    title: 'Gallery (demo)',
    description:
      'Photographs from the gaushala. Placeholder tiles until approved photography is supplied.',
  },
};

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export const demoContactPage: ContactPageContent = {
  hero: {
    eyebrow: 'Contact',
    heading: 'Get in touch.',
    description:
      'Questions about visits, volunteering or the work itself are welcome. Contact details will be published once the organisation confirms them.',
  },
  intro:
    'This page is laid out for the real details. Rather than invent a phone number or an address, each channel states that it is pending verification.',
  notice:
    'No contact details are published yet, and the enquiry form below is not connected to a backend. It validates what you type but does not send anything.',
  channels: [
    {
      id: 'address',
      label: 'Address',
      value: '',
      note: 'Published once confirmed by the organisation.',
      icon: 'map',
    },
    {
      id: 'phone',
      label: 'Phone',
      value: '',
      note: 'No phone number has been supplied yet.',
      icon: 'phone',
    },
    {
      id: 'email',
      label: 'Email',
      value: '',
      note: 'No email address has been supplied yet.',
      icon: 'mail',
    },
  ],
  mapNote:
    'A map will appear here once the site location is confirmed. No map is embedded yet, so nothing is inferred about where the gaushala is.',
  seo: {
    title: 'Contact (demo)',
    description:
      'Contact the gaushala about visits, volunteering or the work. Contact details are pending verification.',
  },
};
