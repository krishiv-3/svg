import {
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_NEWS,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
} from './demo-source';

import type { HomepageContent } from './homepage';

/**
 * Demonstration homepage content.
 *
 * This is the only place the homepage touches the demo dataset. It exists so the
 * real layout can be built, reviewed and tested before the organisation supplies
 * copy, photography or figures.
 *
 * It is **not** a mock API and it is not seed data: nothing here reaches the
 * database, and the production build cannot serve it once
 * `getHomepageContent()` is switched to the API in Phase 6.
 *
 * Nothing in this file invents a verifiable fact. There is no founding date, no
 * registration number, no tax exemption, no address, no phone number and no
 * testimonial from a real person. Figures are labelled as illustrative wherever
 * they appear, and the venue of every event says "demonstration venue".
 */

const ACTIVITY_BULLETS = {
  nourishment: ['Balanced daily feed', 'Clean water, checked often', 'Seasonal adjustments'],
  care: ['Routine health checks', 'Quiet recovery space', 'Individual attention'],
  shelter: ['Shade and ventilation', 'Warmth through winter', 'Safe, dry flooring'],
  community: ['Guided visits by arrangement', 'Volunteer mornings', 'Learning sessions'],
} as const;

const ACTIVITY_LINKS = {
  nourishment: { label: 'Learn more', href: '/our-work' },
  care: { label: 'Learn more', href: '/our-work' },
  shelter: { label: 'Learn more', href: '/our-work' },
  community: { label: 'Learn more', href: '/our-work' },
} as const;

export const demoHomepageContent: HomepageContent = {
  hero: {
    eyebrow: 'Care, every day',
    heading: DEMO_HERO.heading,
    description: DEMO_HERO.description,
    primaryCta: { label: 'Donate', href: '/donate' },
    secondaryCta: { label: DEMO_HERO.secondaryCta.label, href: '/our-work' },
    footnote: 'Preview build — demonstration content, not a live website.',
    image: { label: 'Gaushala life — cows resting in the shade' },
  },

  about: {
    eyebrow: 'About the gaushala',
    heading: 'A place built around care, not convenience.',
    description: undefined,
    body: [
      'A gaushala is more than shelter. It is a daily practice of attention — noticing what an animal needs before it becomes urgent, and being there every day in between.',
      'This page describes the shape of that work: nourishment, health, shelter and the community that makes it possible. The organisation’s own history, people and verified record will replace this text.',
    ],
    link: { label: 'Learn about the gaushala', href: '/about' },
    image: { label: 'The gaushala courtyard at first light' },
    points: [
      'Care shaped around the animals, not the visitors',
      'A calm environment with room to recover',
      'Open to the community by arrangement',
    ],
  },

  activities: {
    intro: {
      eyebrow: 'Our work',
      heading: 'Four commitments, every single day.',
      description:
        'Care is not a single act. These are the routines that make up a day at the gaushala.',
    },
    items: DEMO_ACTIVITIES.map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      bullets: ACTIVITY_BULLETS[activity.icon],
      icon: activity.icon,
      link: ACTIVITY_LINKS[activity.icon],
    })),
  },

  impact: {
    eyebrow: 'Impact',
    heading: 'What care looks like in numbers.',
    description:
      'Verified figures need a reporting period and a source. Until those exist, the numbers below are placeholders that show how the section will read.',
    stats: DEMO_STATISTICS.map((statistic) => ({
      id: statistic.id,
      value: statistic.value,
      ...(statistic.unit === undefined ? {} : { unit: statistic.unit }),
      label: statistic.label,
      note: statistic.note,
    })),
    footnote: 'Illustrative figures — replaced by verified, dated statistics before launch.',
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
    description:
      'Campaigns run for a specific, time-bound purpose. Progress is calculated from the recorded amounts, never typed by hand.',
    items: DEMO_CAMPAIGNS.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      purpose: campaign.purpose,
      raisedMinor: campaign.raisedMinor,
      goalMinor: campaign.goalMinor,
      status: campaign.status,
      imageLabel: campaign.imageLabel,
    })),
    link: { label: 'All campaigns', href: '/campaigns' },
    footnote: 'Demonstration campaigns — no donations are being collected.',
  },

  news: {
    eyebrow: 'Newsroom',
    heading: 'Updates from the gaushala.',
    description: 'Announcements, notes from the care team and progress on current work.',
    items: DEMO_NEWS.map((article) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      dateLabel: article.dateLabel,
      dateTime: article.dateTime,
    })),
    link: { label: 'View all news', href: '/news' },
  },

  events: {
    eyebrow: "What's on",
    heading: 'Come and see the work.',
    description:
      'Visits and volunteer mornings are arranged in advance so the animals are never disturbed.',
    items: DEMO_EVENTS.map((event) => ({
      id: event.id,
      title: event.title,
      day: event.day,
      month: event.month,
      dateTime: event.dateTime,
      time: event.time,
      venue: event.venue,
      status: event.status,
    })),
    link: { label: 'All events', href: '/events' },
  },

  gallery: {
    eyebrow: 'Gallery',
    heading: 'Life at the gaushala.',
    description:
      'Photographs are supplied by the organisation. Until then, every tile is a labelled placeholder.',
    items: DEMO_GALLERY.map((item) => ({
      id: item.id,
      caption: item.caption,
      category: item.category,
      image: { label: item.caption },
    })),
    link: { label: 'View full gallery', href: '/gallery' },
    footnote: 'No stock photography is used anywhere on this site.',
  },

  testimonials: {
    eyebrow: 'Community',
    heading: 'Voices from the community.',
    description:
      'Testimonials are only published with the consent of the person quoted. These examples are fictional.',
    items: DEMO_TESTIMONIALS.map((testimonial) => ({
      id: testimonial.id,
      quote: testimonial.quote,
      name: testimonial.name,
      context: testimonial.context,
    })),
    footnote: 'Fictional examples — not real people and not donor statements.',
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
    title: 'Compassion Begins With Care (demo)',
    description:
      'Demonstration homepage for Shri Vanshidhar Gaushala: daily nourishment, care and shelter for cows. Preview build — content is illustrative and not yet verified.',
  },
};
