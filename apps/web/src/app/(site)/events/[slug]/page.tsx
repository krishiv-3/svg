import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { Alert, Badge, Container, ImageContainer, Section, TextLink } from '@/components/ui';
import { CtaPanel, PageHero } from '@/components/site';

import { getEvent } from '@/content';

/**
 * Event detail.
 *
 * The date, time and venue come from the same record the card uses. Registration
 * is only rendered when the organisation has supplied it — there is no
 * placeholder sign-up that would imply a booking system exists.
 */

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

// Rendered on demand: content lives in the database, so the build must not
// require a running API. Next caches the fetch itself (see the content loaders).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (event === undefined) {
    return { title: 'Event not found', robots: { index: false, follow: false } };
  }

  return {
    title: `${event.title} — demonstration event`,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (event === undefined) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="Event"
        heading={event.title}
        description={event.summary}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Events', href: '/events' },
          { label: event.title },
        ]}
      />

      <Section spacing="compact">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:gap-14">
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-2xl border border-white/60 shadow-glass">
                <ImageContainer
                  {...(event.image.src === undefined ? {} : { src: event.image.src })}
                  {...(event.image.alt === undefined ? {} : { alt: event.image.alt })}
                  aspect="16/9"
                  placeholderLabel={event.image.label}
                  flush
                />
              </div>

              {event.description.map((paragraph) => (
                <p key={paragraph} className="text-body max-w-[66ch] text-charcoal/90">
                  {paragraph}
                </p>
              ))}
            </div>

            <aside className="flex flex-col gap-4">
              <dl className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                    When
                  </dt>
                  <dd>
                    <Badge
                      tone={
                        event.status === 'Cancelled'
                          ? 'danger'
                          : event.status === 'Scheduled'
                            ? 'success'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {event.status}
                    </Badge>
                  </dd>
                </div>

                <time
                  dateTime={event.dateTime}
                  className="text-[length:var(--text-heading)] font-semibold text-cocoa"
                >
                  {event.day} {event.month}
                </time>

                <p className="text-body-sm text-charcoal/90">{event.time}</p>

                <div className="border-t border-sand pt-3">
                  <dt className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                    Where
                  </dt>
                  <dd className="text-body-sm mt-1 text-charcoal/90">{event.venue}</dd>
                </div>
              </dl>

              {event.registration === undefined ? (
                <Alert tone="info" title="Registration is not open">
                  No booking is available for this event. Attendance is arranged directly with the
                  gaushala once contact details are published.
                </Alert>
              ) : (
                <Alert tone="info" title={event.registration.label}>
                  {event.registration.detail}
                </Alert>
              )}

              <TextLink href="/events">Back to all events</TextLink>
            </aside>
          </div>
        </Container>
      </Section>

      <CtaPanel
        content={{
          heading: 'Support the work you came to see.',
          description: 'Fodder, water, veterinary care and shelter upkeep are ongoing costs.',
          cta: { label: 'Donate', href: '/donate' },
          secondary: { label: 'All events', href: '/events' },
          note: 'Online donations are not open yet.',
        }}
      />
    </>
  );
}
