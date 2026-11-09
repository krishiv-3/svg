import {
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_NEWS,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
} from '@/demo';

/**
 * The single import point for the demonstration dataset.
 *
 * Every `*.demo.ts` adapter imports from this module and never from `@/demo`
 * directly, so the whole preview build has exactly one place that reads demo
 * content. `demo.test.ts` enforces that. When the API arrives in Phase 6 the
 * adapters are deleted along with this file.
 *
 * The extra records below add the fields the Phase 5 pages need — slugs,
 * article bodies, campaign stories and event descriptions — without changing the
 * original homepage dataset.
 */

export {
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_NEWS,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
};

/** Stable slugs, aligned with the demonstration records by position. */
export const CAMPAIGN_SLUGS = ['winter-fodder-fund', 'shelter-repair-appeal'] as const;
export const NEWS_SLUGS = [
  'preparing-the-shelters-for-winter',
  'a-morning-with-the-care-team',
  'introducing-a-new-activity-programme',
] as const;
export const EVENT_SLUGS = [
  'community-open-day',
  'volunteer-morning',
  'winter-care-workshop',
] as const;

/** Campaign narratives, keyed by slug. */
export const CAMPAIGN_STORY: Record<string, readonly string[]> = {
  'winter-fodder-fund': [
    'When the temperature drops, grazing thins out and the herd depends entirely on what is brought to them. This campaign exists to cover that gap: a steady supply of fodder through the coldest weeks, stored and rationed so nothing runs short.',
    'The plan is deliberately unglamorous. Buy in bulk while prices are lower, store it dry, and feed it out gradually as conditions worsen. It is the kind of preparation that makes no photographs but prevents the worst days.',
    'Demonstration content: this campaign is fictional. The amounts below are illustrative and no donation is being collected.',
  ],
  'shelter-repair-appeal': [
    'The resting area takes the most wear of anything on the site. Flooring is repaired, shade netting is replaced, and the drainage around the perimeter is cleared before the heat arrives.',
    'Work is scheduled around the animals rather than the other way round: small sections at a time, never the whole shelter at once.',
    'Demonstration content: this campaign is fictional. The amounts below are illustrative and no donation is being collected.',
  ],
};

export const NEWS_BODY: Record<string, readonly string[]> = {
  'preparing-the-shelters-for-winter': [
    'Every year the same work returns: checking that the shelter holds warmth where it should and stays dry where it must. This note describes the seasonal routine rather than announcing a single event.',
    'Flooring is inspected first, because a wet floor is the fastest way to a sick animal. Shade netting that protected through summer comes down, and windbreaks go up on the exposed side.',
    'Feeding times shift slightly. The herd is fed earlier while the day is still warm, and water is checked more often — cold weather does not remove the need for it.',
    'Demonstration article: the text exists to show the reading experience. It is not a record of real work.',
  ],
  'a-morning-with-the-care-team': [
    'A morning at the gaushala begins before visitors arrive. The first pass is observation: who is eating, who is holding back, who is standing oddly.',
    'Anything flagged on that pass is looked at properly. Most days it is small — a minor cut, a hoof that needs trimming — but the point is that nothing waits until it becomes obvious.',
    'This is the part of the work that a photograph rarely captures, and it is the reason routine matters more than any single intervention.',
    'Demonstration article: illustrative copy for layout review.',
  ],
  'introducing-a-new-activity-programme': [
    'The programme is a structured way for the community to take part: guided visits by arrangement, volunteer mornings with a defined task, and short learning sessions about animal care.',
    'It is written as an announcement because that is how the CMS will publish real updates. The dates, numbers and arrangements will come from the organisation.',
    'Demonstration article: illustrative copy for layout review.',
  ],
};

/** Event descriptions, keyed by slug. */
export const EVENT_DETAIL: Record<string, readonly string[]> = {
  'community-open-day': [
    'An open day is a chance to see the work rather than read about it. Visits are grouped and guided so the herd is not disturbed by a continuous stream of people.',
    'Expect to walk the site, meet the care team and hear how the daily routine is organised. Nothing is staged for visitors.',
    'Demonstration event: the date, time and venue are fictional and registration is not open.',
  ],
  'volunteer-morning': [
    'Volunteer mornings are practical: a defined task, a small group and a finish time. Typical work is preparing feed, cleaning the resting area or maintaining the perimeter.',
    'Places are limited deliberately. A large group is not more useful than a small one, and the animals come first.',
    'Demonstration event: the date, time and venue are fictional and registration is not open.',
  ],
  'winter-care-workshop': [
    'A short session on cold-weather care: what changes in feeding, what to watch for in older animals, and how the shelter is prepared.',
    'It is intended for volunteers and for anyone considering supporting the work through the winter months.',
    'Demonstration event: the date, time and venue are fictional and registration is not open.',
  ],
};
