import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { formatInr } from '@gaushala/shared';

import {
  Alert,
  Badge,
  Container,
  ImageContainer,
  ProgressBar,
  Section,
  TextLink,
} from '@/components/ui';
import { CtaPanel, PageHero } from '@/components/site';

import { getCampaign } from '@/content';

/**
 * Campaign detail.
 *
 * Resolves the slug through the content loader; an unknown slug calls
 * `notFound()` so the visitor gets a real 404 rather than a half-rendered page.
 * The amounts and progress come from the same record as the listing.
 */

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

// Rendered on demand: content lives in the database, so the build must not
// require a running API. Next caches the fetch itself (see the content loaders).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);

  if (campaign === undefined) {
    return { title: 'Campaign not found', robots: { index: false, follow: false } };
  }

  return {
    title: `${campaign.title} — demonstration campaign`,
    description: campaign.summary,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function CampaignDetailPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);

  if (campaign === undefined) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="Campaign"
        heading={campaign.title}
        description={campaign.purpose}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.title },
        ]}
      />

      <Section spacing="compact">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr] lg:gap-14">
            <div className="flex flex-col gap-5">
              {campaign.story.map((paragraph) => (
                <p key={paragraph} className="text-body max-w-[66ch] text-charcoal/90">
                  {paragraph}
                </p>
              ))}

              {campaign.updates.length === 0 ? null : (
                <div className="mt-2 flex flex-col gap-4">
                  <h2 className="text-subheading text-cocoa">Updates</h2>

                  <ol className="flex flex-col gap-4 border-l border-sand pl-5">
                    {campaign.updates.map((update) => (
                      <li key={update.title} className="flex flex-col gap-1">
                        <time
                          dateTime={update.dateTime}
                          className="text-[length:var(--text-caption)] text-muted"
                        >
                          {update.dateLabel}
                        </time>
                        <h3 className="text-[length:var(--text-label)] font-semibold text-cocoa">
                          {update.title}
                        </h3>
                        <p className="text-body-sm text-charcoal/90">{update.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-white/60 shadow-glass">
                <ImageContainer
                  {...(campaign.image.src === undefined ? {} : { src: campaign.image.src })}
                  {...(campaign.image.alt === undefined ? {} : { alt: campaign.image.alt })}
                  aspect="4/3"
                  placeholderLabel={campaign.image.label}
                  flush
                />
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                    Progress
                  </span>
                  <Badge tone={campaign.status === 'Active' ? 'success' : 'neutral'} size="sm">
                    {campaign.status}
                  </Badge>
                </div>

                <ProgressBar
                  value={campaign.raisedMinor}
                  max={campaign.goalMinor > 0 ? campaign.goalMinor : campaign.raisedMinor || 1}
                  label={`${campaign.title} progress`}
                  showValue
                />

                <dl className="flex items-baseline justify-between gap-2 text-[length:var(--text-caption)]">
                  <div className="flex flex-col">
                    <dt className="text-muted">Raised</dt>
                    <dd className="text-[length:var(--text-body-sm)] font-semibold text-cocoa tabular-nums">
                      {formatInr(campaign.raisedMinor)}
                    </dd>
                  </div>
                  <div className="flex flex-col text-right">
                    <dt className="text-muted">Target</dt>
                    <dd className="text-[length:var(--text-body-sm)] text-cocoa tabular-nums">
                      {formatInr(campaign.goalMinor)}
                    </dd>
                  </div>
                </dl>

                <p className="text-[length:var(--text-caption)] text-muted">
                  Demonstration amounts. No donation is being collected.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Alert tone="info" title="Donations are not open yet">
                  Online giving is not connected. This page describes the campaign; it does not take
                  payments.
                </Alert>

                <TextLink href="/campaigns">Back to all campaigns</TextLink>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <CtaPanel
        content={{
          heading: 'Support the work behind this campaign.',
          description:
            'General donations go to whatever the herd needs most that week, which is often the most useful help.',
          cta: { label: 'Donate', href: '/donate' },
          secondary: { label: 'All campaigns', href: '/campaigns' },
          note: 'Online donations are not open yet.',
        }}
      />
    </>
  );
}
