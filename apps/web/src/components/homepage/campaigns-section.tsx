import { ButtonLink, CampaignCard, Container, Section, SectionHeading } from '@/components/ui';

import type { HomepageCampaigns } from '@/content';

/**
 * Campaigns.
 *
 * Image-led cards with status, progress and amounts. Progress is derived from
 * `raisedMinor` / `goalMinor` inside the card, so a percentage can never drift
 * away from the recorded values — it is never typed by hand.
 *
 * Demonstration values are labelled both on each card and in the section note.
 */
export function CampaignsSection({ campaigns }: { campaigns: HomepageCampaigns }) {
  return (
    <Section id="campaigns" tone="muted" aria-labelledby="campaigns-heading">
      <Container className="flex flex-col gap-9">
        <SectionHeading
          id="campaigns-heading"
          level={2}
          {...(campaigns.eyebrow === undefined ? {} : { eyebrow: campaigns.eyebrow })}
          title={campaigns.heading}
          {...(campaigns.description === undefined ? {} : { description: campaigns.description })}
          actions={
            <ButtonLink href={campaigns.link.href} variant="outline" size="sm">
              {campaigns.link.label}
            </ButtonLink>
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          {campaigns.items.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              title={campaign.title}
              purpose={campaign.purpose}
              raisedMinor={campaign.raisedMinor}
              goalMinor={campaign.goalMinor}
              status={campaign.status}
              imageLabel={campaign.imageLabel}
              demo
              link={{ href: '/campaigns', label: 'Support this campaign' }}
            />
          ))}
        </div>

        <p className="text-[length:var(--text-caption)] text-muted">{campaigns.footnote}</p>
      </Container>
    </Section>
  );
}
