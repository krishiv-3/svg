import type { Metadata } from 'next';

import { ArrowRightIcon, HeartIcon, LeafIcon, MapPinIcon, UsersIcon } from '@/components/icons';
import { ButtonLink, Container, Section, SectionHeading, TextLink } from '@/components/ui';
import { CtaPanel, PageHero, ProseSection } from '@/components/site';

import { getOurWorkPage } from '@/content';
import type { WorkIcon } from '@/content/library';

/**
 * Our work.
 *
 * One introduction, then one alternating section per area of work. Each section
 * is anchored by its slug so links can point at `#daily-nourishment` today and
 * at a dedicated route later without changing the copy.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getOurWorkPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/our-work' },
    robots: { index: false, follow: false },
  };
}

const WORK_ICONS: Record<WorkIcon, typeof HeartIcon> = {
  nourishment: LeafIcon,
  care: HeartIcon,
  shelter: MapPinIcon,
  community: UsersIcon,
};

export default async function OurWorkPage() {
  const content = await getOurWorkPage();

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Our work' }]}
      />

      <Section spacing="compact" aria-labelledby="work-intro-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <SectionHeading
              id="work-intro-heading"
              level={2}
              eyebrow="Overview"
              title={content.intro.heading}
            />

            <div className="flex max-w-[62ch] flex-col gap-3">
              {content.intro.body.map((paragraph) => (
                <p key={paragraph} className="text-body text-charcoal/90">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Jump links: the same anchors the sections below define. */}
          <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.activities.map((activity) => {
              const Icon = WORK_ICONS[activity.icon];

              return (
                <li key={activity.id}>
                  <a
                    href={`#${activity.slug}`}
                    className="group hover-lift flex h-full flex-col gap-2 rounded-2xl border border-sand bg-white p-4 shadow-soft"
                  >
                    <span className="bg-[image:var(--gradient-icon-tile)] ring-1 ring-white/60 ring-inset flex h-9 w-9 items-center justify-center rounded-lg text-terracotta-ink">
                      <Icon size={17} />
                    </span>
                    <span className="text-[length:var(--text-label)] inline-flex items-center gap-1.5 font-medium text-cocoa">
                      {activity.title}
                      <ArrowRightIcon
                        size={13}
                        className="ease-standard transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {content.activities.map((activity, index) => (
        <ProseSection
          key={activity.id}
          id={activity.slug}
          tone={index % 2 === 0 ? 'default' : 'muted'}
          reverse={index % 2 === 1}
          eyebrow={activity.title}
          heading={activity.summary}
          body={activity.body}
          bullets={activity.bullets}
          image={activity.image}
          actions={<TextLink href="/contact">Ask about this work</TextLink>}
        />
      ))}

      <Section spacing="compact" tone="muted">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-sand bg-white p-6 shadow-soft sm:flex-row sm:items-center">
            <div>
              <h2 className="text-subheading text-cocoa">See the work for yourself</h2>
              <p className="text-body-sm mt-1 max-w-[52ch] text-charcoal/90">
                Visits and volunteer mornings are arranged in advance, in small groups.
              </p>
            </div>
            <ButtonLink href="/events" variant="secondary" size="md">
              View events
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <CtaPanel content={content.cta} />
    </>
  );
}
