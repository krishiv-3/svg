import type { ReactNode } from 'react';

import { formatInr } from '@gaushala/shared';

import { cn } from '@/lib/cn';

import { ArrowRightIcon, CheckIcon } from '../icons';
import { Badge } from './badge';
import { ImageContainer, type ImageAspect } from './image-container';
import { ProgressBar } from './progress';

/**
 * Content cards.
 *
 * One shared surface, several content shapes. Every card:
 *  - is an `<article>` with a heading level chosen by the page, so the document
 *    outline stays correct;
 *  - supports an optional single link that stretches across the card, giving a
 *    large pointer target while keeping one real anchor in the tab order;
 *  - reserves its image aspect ratio, so cards do not shift while loading;
 *  - can mark itself as demonstration content (`demo`), so unverified data can
 *    never be mistaken for a real claim.
 *
 * Visual language: a warm white surface with a fine sand border, a soft ambient
 * shadow, a top sheen that suggests a light source, and a quiet lift on hover.
 * Only the surfaces move — never the text inside them.
 *
 * Cards never invent content: every string, amount and date is passed in by the
 * caller, which in production is the CMS through the API.
 */

export interface CardLink {
  href: string;
  label: string;
}

interface CardSurfaceProps {
  children: ReactNode;
  /** Adds hover lift and a focus ring around the whole card. */
  linked?: boolean;
  className?: string;
  as?: 'article' | 'div';
}

function CardSurface({ children, linked = false, className, as = 'article' }: CardSurfaceProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'border border-sand/90 bg-white shadow-soft',
        linked
          ? cn(
              'hover-lift',
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cocoa',
            )
          : undefined,
        className,
      )}
    >
      {/* Top light: a very soft sheen so the card reads as a lit surface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[image:var(--gradient-card-sheen)]"
      />
      {children}
    </Tag>
  );
}

/** Visible marker for demonstration content. */
function DemoChip({ demo }: { demo: boolean }) {
  if (!demo) return null;

  return (
    <Badge tone="accent" size="sm" className="shrink-0">
      DEMO
    </Badge>
  );
}

/** Stretched link: one anchor, whole-card target, arrow that moves on hover. */
function StretchedLink({ link }: { link: CardLink }) {
  return (
    <a
      href={link.href}
      className={cn(
        'text-[length:var(--text-label)] font-medium text-terracotta-ink',
        'after:absolute after:inset-0 after:content-[""]',
        'hover:text-cocoa',
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {link.label}
        <ArrowRightIcon
          size={14}
          className="transition-transform duration-200 ease-standard group-hover:translate-x-0.5"
        />
      </span>
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Image card                                                                 */
/* -------------------------------------------------------------------------- */

export interface ImageCardProps {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: string;
  link?: CardLink;
  imageLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  aspect?: ImageAspect;
  demo?: boolean;
  /** Heading level for the card title. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function ImageCard({
  title,
  description,
  eyebrow,
  meta,
  link,
  imageLabel = 'Card image',
  imageSrc,
  imageAlt,
  aspect = '16/9',
  demo = false,
  headingLevel = 3,
  className,
}: ImageCardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <CardSurface linked={link !== undefined} className={className}>
      <div className="media-zoom relative overflow-hidden">
        <ImageContainer
          {...(imageSrc === undefined ? {} : { src: imageSrc })}
          {...(imageAlt === undefined ? {} : { alt: imageAlt })}
          aspect={aspect}
          placeholderLabel={imageLabel}
          flush
        />
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
        {eyebrow === undefined ? null : (
          <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
            {eyebrow}
          </p>
        )}

        <div className="flex items-start justify-between gap-2">
          <Heading className="text-subheading text-cocoa">{title}</Heading>
          <DemoChip demo={demo} />
        </div>

        {description === undefined ? null : (
          <p className="text-body-sm text-charcoal/90">{description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {meta === undefined ? null : (
            <span className="text-[length:var(--text-caption)] text-muted">{meta}</span>
          )}
          {link === undefined ? null : <StretchedLink link={link} />}
        </div>
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Activity card                                                              */
/* -------------------------------------------------------------------------- */

export interface ActivityCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  /** Short supporting points, shown as a list. */
  bullets?: readonly string[];
  link?: CardLink;
  demo?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function ActivityCard({
  title,
  description,
  icon,
  bullets,
  link,
  demo = false,
  headingLevel = 3,
  className,
}: ActivityCardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <CardSurface linked={link !== undefined} className={className}>
      <div className="relative flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          {icon === undefined ? null : (
            <span
              aria-hidden="true"
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl',
                'bg-[image:var(--gradient-icon-tile)] text-terracotta-ink',
                'ring-1 ring-white/60 ring-inset',
                'transition-transform duration-300 ease-standard group-hover:-translate-y-0.5 group-hover:scale-[1.04]',
              )}
            >
              {icon}
            </span>
          )}
          <DemoChip demo={demo} />
        </div>

        <Heading className="text-subheading text-cocoa">{title}</Heading>
        <p className="text-body-sm text-charcoal/90">{description}</p>

        {bullets === undefined || bullets.length === 0 ? null : (
          <ul className="flex flex-col gap-1.5 pt-1">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 text-[length:var(--text-caption)] text-charcoal/85"
              >
                <CheckIcon size={13} className="mt-0.5 shrink-0 text-terracotta-ink" />
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {link === undefined ? null : (
          <div className="mt-auto pt-3">
            <StretchedLink link={link} />
          </div>
        )}
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Campaign card                                                              */
/* -------------------------------------------------------------------------- */

export interface CampaignCardProps {
  title: string;
  purpose: string;
  /** Amount raised, in minor units (paise). */
  raisedMinor: number;
  /** Target amount, in minor units (paise). 0 hides the goal. */
  goalMinor: number;
  status?: string;
  link?: CardLink;
  imageLabel?: string;
  demo?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function CampaignCard({
  title,
  purpose,
  raisedMinor,
  goalMinor,
  status,
  link,
  imageLabel = 'Campaign photograph',
  demo = false,
  headingLevel = 3,
  className,
}: CampaignCardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <CardSurface linked={link !== undefined} className={className}>
      <div className="media-zoom relative overflow-hidden">
        <ImageContainer aspect="16/9" placeholderLabel={imageLabel} flush />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <DemoChip demo={demo} />
          {status === undefined ? null : (
            <span className="glass-strong rounded-full px-2.5 py-1 text-[length:var(--text-caption)] font-medium text-cocoa">
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <Heading className="text-subheading text-cocoa">{title}</Heading>
        <p className="text-body-sm text-charcoal/90">{purpose}</p>

        <div className="mt-1 flex flex-col gap-2">
          <ProgressBar
            value={raisedMinor}
            max={goalMinor > 0 ? goalMinor : raisedMinor || 1}
            label={`${title} progress`}
          />
          <div className="flex items-baseline justify-between gap-2 text-[length:var(--text-caption)]">
            <span className="font-semibold text-cocoa tabular-nums">{formatInr(raisedMinor)}</span>
            <span className="text-muted tabular-nums">
              {goalMinor > 0 ? `of ${formatInr(goalMinor)}` : 'no target set'}
            </span>
          </div>
        </div>

        {link === undefined ? null : (
          <div className="mt-auto flex items-center justify-end pt-3">
            <StretchedLink link={link} />
          </div>
        )}
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Event card                                                                 */
/* -------------------------------------------------------------------------- */

export interface EventCardProps {
  title: string;
  /** Day number, e.g. "14". */
  day: string;
  /** Short month, e.g. "Dec". */
  month: string;
  /** Machine-readable date for `<time datetime>`. */
  dateTime: string;
  time: string;
  venue: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
  link?: CardLink;
  demo?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function EventCard({
  title,
  day,
  month,
  dateTime,
  time,
  venue,
  status,
  link,
  demo = false,
  headingLevel = 3,
  className,
}: EventCardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <CardSurface linked={link !== undefined} className={className}>
      <div className="relative flex flex-1 gap-4 p-5">
        <time
          dateTime={dateTime}
          className={cn(
            'flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl text-center',
            'bg-[image:var(--gradient-icon-tile)] ring-1 ring-white/60 ring-inset',
            'transition-transform duration-300 ease-standard group-hover:-translate-y-0.5',
          )}
        >
          <span className="text-[length:var(--text-heading)] leading-none font-semibold text-cocoa">
            {day}
          </span>
          <span className="text-[length:var(--text-overline)] tracking-[0.14em] text-terracotta-ink uppercase">
            {month}
          </span>
        </time>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <Heading className="text-subheading text-cocoa">{title}</Heading>
            <DemoChip demo={demo} />
          </div>

          <p className="text-[length:var(--text-caption)] text-muted">
            {time} · {venue}
          </p>

          {status === undefined ? null : (
            <div className="mt-1">
              <Badge
                tone={
                  status === 'Cancelled' ? 'danger' : status === 'Scheduled' ? 'success' : 'neutral'
                }
                size="sm"
              >
                {status}
              </Badge>
            </div>
          )}

          {link === undefined ? null : (
            <div className="mt-auto pt-2">
              <StretchedLink link={link} />
            </div>
          )}
        </div>
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* News card                                                                  */
/* -------------------------------------------------------------------------- */

export interface NewsCardProps {
  title: string;
  excerpt: string;
  category?: string;
  dateLabel: string;
  dateTime: string;
  link?: CardLink;
  imageLabel?: string;
  demo?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function NewsCard({
  title,
  excerpt,
  category,
  dateLabel,
  dateTime,
  link,
  imageLabel = 'Article cover photograph',
  demo = false,
  headingLevel = 3,
  className,
}: NewsCardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <CardSurface linked={link !== undefined} className={className}>
      <div className="media-zoom relative overflow-hidden">
        <ImageContainer aspect="3/2" placeholderLabel={imageLabel} flush />

        {demo ? (
          <div className="absolute top-3 left-3">
            <DemoChip demo />
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          {category === undefined ? null : (
            <span className="rounded-full bg-terracotta/10 px-2.5 py-1 text-[length:var(--text-caption)] font-medium text-terracotta-ink">
              {category}
            </span>
          )}
          <time dateTime={dateTime} className="text-[length:var(--text-caption)] text-muted">
            {dateLabel}
          </time>
        </div>

        <Heading className="text-subheading text-cocoa">{title}</Heading>
        <p className="text-body-sm text-charcoal/90">{excerpt}</p>

        {link === undefined ? null : (
          <div className="mt-auto pt-3">
            <StretchedLink link={link} />
          </div>
        )}
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery card                                                               */
/* -------------------------------------------------------------------------- */

export interface GalleryCardProps {
  caption: string;
  category?: string;
  imageLabel?: string;
  aspect?: ImageAspect;
  demo?: boolean;
  className?: string;
}

export function GalleryCard({
  caption,
  category,
  imageLabel = 'Gallery photograph',
  aspect = '1/1',
  demo = false,
  className,
}: GalleryCardProps) {
  return (
    <CardSurface as="div" className={className}>
      <div className="media-zoom relative overflow-hidden">
        <ImageContainer aspect={aspect} placeholderLabel={imageLabel} flush />

        {/* Hover scrim: the caption stays in the DOM either way. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(44,33,27,0)_45%,rgba(44,33,27,0.55)_100%)] opacity-0 transition-opacity duration-300 ease-standard group-hover:opacity-100"
        />

        <div className="absolute top-2.5 left-2.5">
          <DemoChip demo={demo} />
        </div>
      </div>

      <div className="relative flex flex-col gap-0.5 p-3.5">
        <p className="text-[length:var(--text-caption)] font-medium text-cocoa">{caption}</p>
        {category === undefined ? null : (
          <p className="text-[length:var(--text-caption)] text-muted">{category}</p>
        )}
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonial card                                                           */
/* -------------------------------------------------------------------------- */

export interface TestimonialCardProps {
  quote: string;
  name: string;
  context?: string;
  demo?: boolean;
  className?: string;
}

export function TestimonialCard({
  quote,
  name,
  context,
  demo = false,
  className,
}: TestimonialCardProps) {
  return (
    <CardSurface className={cn('bg-white', className)}>
      <div className="relative flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden="true"
            className="font-serif text-[2.75rem] leading-[0.7] text-brass/70"
          >
            &ldquo;
          </span>
          <DemoChip demo={demo} />
        </div>

        <blockquote className="text-body text-charcoal/90">{quote}</blockquote>

        <figcaption className="mt-auto flex items-center gap-3 border-t border-sand pt-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-icon-tile)] text-[length:var(--text-label)] font-semibold text-cocoa ring-1 ring-white/60 ring-inset"
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="flex flex-col">
            <span className="text-[length:var(--text-label)] font-medium text-cocoa">{name}</span>
            {context === undefined ? null : (
              <span className="text-[length:var(--text-caption)] text-muted">{context}</span>
            )}
          </span>
        </figcaption>
      </div>
    </CardSurface>
  );
}

/* -------------------------------------------------------------------------- */
/* Statistic card                                                             */
/* -------------------------------------------------------------------------- */

export interface StatisticCardProps {
  value: string;
  label: string;
  unit?: string;
  note?: string;
  demo?: boolean;
  /** `inverse` is for dark bands (e.g. the homepage impact panel). */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function StatisticCard({
  value,
  label,
  unit,
  note,
  demo = false,
  tone = 'default',
  className,
}: StatisticCardProps) {
  const inverse = tone === 'inverse';

  return (
    <CardSurface
      as="div"
      className={cn(
        inverse ? 'border-white/15 bg-white/5' : 'border-sand/90 bg-ivory/70',
        className,
      )}
    >
      <div className="relative flex flex-1 flex-col gap-1.5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-title leading-none font-semibold tabular-nums',
                inverse ? 'text-ivory' : 'text-cocoa',
              )}
            >
              {value}
            </span>
            {unit === undefined ? null : (
              <span
                className={cn(
                  'text-[length:var(--text-label)]',
                  inverse ? 'text-ivory/70' : 'text-muted',
                )}
              >
                {unit}
              </span>
            )}
          </p>
          <DemoChip demo={demo} />
        </div>

        <span
          aria-hidden="true"
          className="mt-1 block h-0.5 w-10 rounded-full bg-[image:var(--gradient-cta)]"
        />

        <p
          className={cn(
            'mt-1 text-[length:var(--text-label)] font-medium',
            inverse ? 'text-ivory/90' : 'text-cocoa',
          )}
        >
          {label}
        </p>

        {note === undefined ? null : (
          <p
            className={cn(
              'text-[length:var(--text-caption)]',
              inverse ? 'text-ivory/60' : 'text-muted',
            )}
          >
            {note}
          </p>
        )}
      </div>
    </CardSurface>
  );
}
