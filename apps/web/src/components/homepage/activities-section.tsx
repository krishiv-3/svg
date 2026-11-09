import type { ReactNode } from 'react';

import { HeartIcon, LeafIcon, MapPinIcon, UsersIcon } from '@/components/icons';
import { ActivityCard, Container, Section, SectionHeading } from '@/components/ui';

import type { HomepageActivityIcon, HomepageActivities } from '@/content';

const ACTIVITY_ICONS: Record<HomepageActivityIcon, ReactNode> = {
  nourishment: <LeafIcon size={22} />,
  care: <HeartIcon size={22} />,
  shelter: <MapPinIcon size={22} />,
  community: <UsersIcon size={22} />,
};

/**
 * Four commitments.
 *
 * Uses the approved `ActivityCard`: gradient icon tile, supporting points and a
 * quiet hover lift. Cards stretch to equal height because the grid items are
 * flex containers, so a longer description never leaves a ragged row.
 */
export function ActivitiesSection({ activities }: { activities: HomepageActivities }) {
  return (
    <Section id="our-work" tone="muted" aria-labelledby="activities-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="activities-heading"
          level={2}
          {...(activities.intro.eyebrow === undefined ? {} : { eyebrow: activities.intro.eyebrow })}
          title={activities.intro.heading}
          {...(activities.intro.description === undefined
            ? {}
            : { description: activities.intro.description })}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {activities.items.map((activity) => (
            <ActivityCard
              key={activity.id}
              title={activity.title}
              description={activity.description}
              bullets={activity.bullets}
              icon={ACTIVITY_ICONS[activity.icon]}
              link={activity.link}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
