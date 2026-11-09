import { ButtonLink, Container, EventCard, Section, SectionHeading } from '@/components/ui';

import type { HomepageEvents } from '@/content';

/**
 * Events.
 *
 * The date tile leads each card, so the calendar is scannable before reading any
 * copy. Status is explicit text plus a badge rather than colour alone, and the
 * venue is only shown because the content contract carries a verified string.
 */
export function EventsSection({ events }: { events: HomepageEvents }) {
  return (
    <Section id="events" tone="muted" aria-labelledby="events-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="events-heading"
          level={2}
          {...(events.eyebrow === undefined ? {} : { eyebrow: events.eyebrow })}
          title={events.heading}
          {...(events.description === undefined ? {} : { description: events.description })}
          actions={
            <ButtonLink href={events.link.href} variant="outline" size="sm">
              {events.link.label}
            </ButtonLink>
          }
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.items.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              day={event.day}
              month={event.month}
              dateTime={event.dateTime}
              time={event.time}
              venue={event.venue}
              status={event.status}
              link={{ href: '/events', label: 'Event details' }}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
