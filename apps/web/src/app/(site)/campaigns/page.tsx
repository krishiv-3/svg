import type { Metadata } from 'next';

import { Alert, ButtonLink, CampaignCard, Container, Section } from '@/components/ui';
import { CtaPanel, PageHero } from '@/components/site';

import { getCampaignsPage } from '@/content';

/**
 * Campaign listing.
 *
 * Cards link to the campaign detail route. Progress is computed inside the card
 * from the record's amounts, so the listing and the detail page can never show
 * different percentages.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getCampaignsPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/campaigns' },
    robots: { index: false, follow: false },
  };
}

export default async function CampaignsPage() {
  const content = await getCampaignsPage();

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Campaigns' }]}
      />

      <Section spacing="compact">
        <Container className="flex flex-col gap-7">
          <Alert tone="warning" title="Demonstration campaigns">
            {content.note}
          </Alert>

          <ul className="grid gap-5 md:grid-cols-2">
            {content.items.map((campaign) => (
              <li key={campaign.id} className="h-full">
                <CampaignCard
                  className="h-full"
                  title={campaign.title}
                  purpose={campaign.purpose}
                  raisedMinor={campaign.raisedMinor}
                  goalMinor={campaign.goalMinor}
                  status={campaign.status}
                  imageLabel={campaign.image.label}
                  link={{ href: `/campaigns/${campaign.slug}`, label: 'Campaign details' }}
                  demo
                />
              </li>
            ))}
          </ul>

          <div>
            <ButtonLink href="/donate" variant="outline" size="md">
              Donation options
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaPanel content={content.cta} />
    </>
  );
}
