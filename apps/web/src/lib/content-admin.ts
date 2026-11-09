/**
 * Field descriptors for the admin content editor.
 *
 * Activities, events and articles differ only in their fields, so one editor is
 * driven by this table instead of three near-identical forms.
 */

export type ContentKind = 'activities' | 'events' | 'news';

export interface FieldDescriptor {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'textarea' | 'datetime' | 'number' | 'checkbox' | 'select';
  readonly hint?: string;
  readonly required?: boolean;
  readonly rows?: number;
}

export interface ContentDescriptor {
  readonly kind: ContentKind;
  readonly singular: string;
  readonly plural: string;
  readonly fields: readonly FieldDescriptor[];
  readonly hasCategorySelect: boolean;
}

const SEO: readonly FieldDescriptor[] = [
  { key: 'seoTitle', label: 'SEO title', type: 'text', hint: 'Up to 70 characters.' },
  { key: 'seoDescription', label: 'SEO description', type: 'text', hint: 'Up to 180 characters.' },
];

export const CONTENT_DESCRIPTORS: Record<ContentKind, ContentDescriptor> = {
  activities: {
    kind: 'activities',
    singular: 'Activity',
    plural: 'Activities',
    hasCategorySelect: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      {
        key: 'shortDescription',
        label: 'Short description',
        type: 'textarea',
        rows: 2,
        required: true,
      },
      { key: 'body', label: 'Body', type: 'textarea', rows: 6, required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'isFeatured', label: 'Feature on the homepage', type: 'checkbox' },
      ...SEO,
    ],
  },
  events: {
    kind: 'events',
    singular: 'Event',
    plural: 'Events',
    hasCategorySelect: false,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', rows: 5, required: true },
      { key: 'startAt', label: 'Starts at', type: 'datetime', required: true },
      { key: 'endAt', label: 'Ends at', type: 'datetime' },
      { key: 'venueName', label: 'Venue', type: 'text' },
      { key: 'venueAddress', label: 'Venue address', type: 'text' },
      {
        key: 'registrationUrl',
        label: 'Registration URL',
        type: 'text',
        hint: 'Full https URL, or leave empty.',
      },
      { key: 'isFeatured', label: 'Feature on the homepage', type: 'checkbox' },
      ...SEO,
    ],
  },
  news: {
    kind: 'news',
    singular: 'Article',
    plural: 'News & Articles',
    hasCategorySelect: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2, required: true },
      { key: 'body', label: 'Body', type: 'textarea', rows: 8, required: true },
      { key: 'categoryId', label: 'Category', type: 'select' },
      { key: 'attributionName', label: 'Attribution', type: 'text' },
      { key: 'readingMinutes', label: 'Reading minutes', type: 'number' },
      ...SEO,
    ],
  },
};

export function isContentKind(value: string): value is ContentKind {
  return value === 'activities' || value === 'events' || value === 'news';
}

export function descriptorFor(kind: string): ContentDescriptor {
  if (!isContentKind(kind)) {
    throw new Error(`Unknown content kind: ${kind}`);
  }

  return CONTENT_DESCRIPTORS[kind];
}
