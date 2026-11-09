import type {
  ActivityDto,
  CampaignDetailDto,
  CampaignSummaryDto,
  EventDto,
  GalleryAlbumDto,
  GalleryItemDto,
  ImpactStatDto,
  NewsDetailDto,
  NewsSummaryDto,
  PageDto,
  TestimonialDto,
} from '@gaushala/shared';

import type {
  EventRecord,
  GalleryRecord,
  NewsRecord,
  WorkActivity,
  CampaignRecord,
} from '@/content/library';
import type { HomepageActivity, HomepageImpactStat } from '@/content/homepage';

/**
 * API DTO → existing page contract.
 *
 * The pages were built against the contracts in `content/homepage.ts` and
 * `content/library.ts`; this module is the seam that lets the database feed them
 * without touching a single component. Fields the database does not carry yet
 * (icons, bullet lists) get a neutral value rather than invented copy.
 */

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: 'short' };
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};
const SHORT_DAY: Intl.DateTimeFormatOptions = { day: '2-digit' };

function toDate(iso: string | null): Date | null {
  return iso === null ? null : new Date(iso);
}

export function formatDate(iso: string | null): string {
  const date = toDate(iso);
  return date === null ? '' : new Intl.DateTimeFormat('en-IN', DATE_FORMAT).format(date);
}

function formatTime(iso: string | null): string {
  const date = toDate(iso);
  return date === null ? '' : new Intl.DateTimeFormat('en-IN', TIME_FORMAT).format(date);
}

/** Campaign status is derived from what the record actually says. */
export function campaignStatus(row: CampaignSummaryDto): string {
  if (!row.acceptsDonations) return 'Closed';
  const end = toDate(row.endDate);
  if (end !== null && end.getTime() < Date.now()) return 'Closed';
  return 'Active';
}

export function mapCampaign(row: CampaignSummaryDto): CampaignRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    purpose: row.purposeSummary,
    summary: row.purposeSummary,
    story: [],
    // `null` means "not reported yet"; the card renders it as zero progress.
    raisedMinor: row.raised.amountMinor ?? 0,
    goalMinor: row.target.amountMinor ?? 0,
    status: campaignStatus(row),
    image: { label: row.cover?.alt ?? 'Campaign photograph' },
    startedOn: row.startDate ?? '',
    updates: [],
  };
}

export function mapCampaignDetail(row: CampaignDetailDto): CampaignRecord {
  return {
    ...mapCampaign(row),
    story: row.paragraphs,
    updates: row.updates.map((update) => ({
      dateLabel: formatDate(update.publishedAt),
      dateTime: update.publishedAt ?? '',
      title: update.title,
      body: update.paragraphs.join(' '),
    })),
  };
}

const EVENT_STATUS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  POSTPONED: 'Postponed',
} as const;

export function mapEvent(row: EventDto): EventRecord {
  const start = toDate(row.startAt);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    day: start === null ? '' : new Intl.DateTimeFormat('en-IN', SHORT_DAY).format(start),
    month: start === null ? '' : new Intl.DateTimeFormat('en-IN', MONTH_FORMAT).format(start),
    dateTime: row.startAt ?? '',
    time: formatTime(row.startAt),
    venue: row.venueName ?? 'Venue to be confirmed',
    status: EVENT_STATUS[row.eventStatus],
    summary: row.summary,
    description: row.paragraphs,
    image: { label: row.poster?.alt ?? 'Event photograph' },
  };
}

export function mapNews(row: NewsSummaryDto): NewsRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category?.name ?? 'News',
    dateLabel: formatDate(row.publishedAt),
    dateTime: row.publishedAt ?? '',
    body: [],
    image: { label: row.cover?.alt ?? 'Article cover photograph' },
  };
}

export function mapNewsDetail(row: NewsDetailDto): NewsRecord {
  return { ...mapNews(row), body: row.paragraphs };
}

export function mapGalleryItem(row: GalleryItemDto): GalleryRecord {
  return {
    id: row.id,
    caption: row.caption ?? row.alt,
    category: row.category?.name ?? 'Gallery',
    image: { label: row.alt },
  };
}

export function mapAlbum(row: GalleryAlbumDto): string {
  return row.name;
}

/** The homepage activity card needs an icon; the database carries a category. */
function activityIcon(category: string | null, index: number): HomepageActivity['icon'] {
  const normalised = category?.toLowerCase() ?? '';

  if (normalised.includes('nourish') || normalised.includes('feed')) return 'nourishment';
  if (normalised.includes('shelter')) return 'shelter';
  if (normalised.includes('communit') || normalised.includes('visit')) return 'community';

  const fallback: HomepageActivity['icon'][] = ['nourishment', 'care', 'shelter', 'community'];
  return fallback[index % fallback.length] ?? 'care';
}

export function mapActivity(row: ActivityDto, index: number): WorkActivity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.paragraphs,
    bullets: [],
    icon: activityIcon(row.category, index),
    image: { label: row.media?.alt ?? `${row.title} — photograph` },
  };
}

export function mapHomepageActivity(row: ActivityDto, index: number): HomepageActivity {
  const mapped = mapActivity(row, index);

  return {
    id: mapped.id,
    title: mapped.title,
    description: mapped.summary,
    icon: mapped.icon,
    bullets: [],
    link: { label: 'Learn more', href: `/our-work#${mapped.slug}` },
  };
}

export function mapImpactStat(row: ImpactStatDto): HomepageImpactStat {
  return {
    id: row.id,
    value: String(row.value),
    ...(row.unit === null ? {} : { unit: row.unit }),
    label: row.label,
    note: row.sourceNote ?? row.methodology,
  };
}

export function mapTestimonial(row: TestimonialDto) {
  return {
    id: row.id,
    quote: row.quote,
    name: row.displayName,
    ...(row.location === null ? {} : { context: row.location }),
  };
}

/** Page copy: only the fields the pages can render from a `pages` row. */
export function mapPageCopy(row: PageDto) {
  return {
    title: row.title,
    description: row.summary ?? '',
    paragraphs: row.paragraphs,
  };
}
