import type { Metadata } from 'next';

import { Alert, Container, EventCard, Section, SectionHeading } from '@/components/ui';
import { CtaPanel, PageHero } from '@/components/site';

import { getEventsPage } from '@/content';

/**
 * Events listing.
 *
 * Upcoming and past events are separate groups rather than one list, because the
 * two answer different questions ("what can I attend?" vs "what happened?").
 * Each card links to its detail route.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getEventsPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/events' },
    robots: { index: false, follow: false },
  };
}

export default async function EventsPage() {
  const content = await getEventsPage();

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Events' }]}
      />

      <Section spacing="compact">
        <Container className="flex flex-col gap-10">
          <Alert tone="warning" title="Demonstration events">
            {content.note}
          </Alert>

          <div className="flex flex-col gap-6">
            <SectionHeading level={2} eyebrow="Upcoming" title="What's coming up" />

            {content.upcoming.length === 0 ? (
              <p className="text-body-sm text-muted">
                No upcoming events are published at the moment.
              </p>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {content.upcoming.map((event) => (
                  <li key={event.id} className="h-full">
                    <EventCard
                      className="h-full"
                      title={event.title}
                      day={event.day}
                      month={event.month}
                      dateTime={event.dateTime}
                      time={event.time}
                      venue={event.venue}
                      status={event.status}
                      link={{ href: `/events/${event.slug}`, label: 'Event details' }}
                      demo
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <SectionHeading level={2} eyebrow="Archive" title="Past events" />

            {content.past.length === 0 ? (
              <p className="text-body-sm text-muted">No past events have been recorded yet.</p>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {content.past.map((event) => (
                  <li key={event.id} className="h-full">
                    <EventCard
                      className="h-full"
                      title={event.title}
                      day={event.day}
                      month={event.month}
                      dateTime={event.dateTime}
                      time={event.time}
                      venue={event.venue}
                      status={event.status}
                      link={{ href: `/events/${event.slug}`, label: 'Event details' }}
                      demo
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>

      <CtaPanel content={content.cta} />
    </>
  );
}
