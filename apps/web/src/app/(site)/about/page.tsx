import type { Metadata } from 'next';

import { HeartIcon, LeafIcon, UsersIcon, CheckIcon } from '@/components/icons';
import { Container, Section, SectionHeading } from '@/components/ui';
import { CtaPanel, PageHero, ProseSection } from '@/components/site';

import { getAboutPage } from '@/content';
import type { AboutValue } from '@/content/library';

/**
 * About page.
 *
 * Sections: page hero, introduction, history placeholder, mission and values,
 * approach to animal care, closing donation panel.
 *
 * The history section is intentionally empty of facts: no founding date,
 * registration or milestone is published because none has been verified.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getAboutPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/about' },
    robots: { index: false, follow: false },
  };
}

const VALUE_ICONS = {
  heart: HeartIcon,
  leaf: LeafIcon,
  users: UsersIcon,
  check: CheckIcon,
} as const;

function ValueCard({ value }: { value: AboutValue }) {
  const Icon = VALUE_ICONS[value.icon];

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-sand bg-white p-5 shadow-soft">
      <span className="bg-[image:var(--gradient-icon-tile)] ring-1 ring-white/60 ring-inset flex h-11 w-11 items-center justify-center rounded-xl text-terracotta-ink">
        <Icon size={20} />
      </span>
      <h3 className="text-subheading text-cocoa">{value.title}</h3>
      <p className="text-body-sm text-charcoal/90">{value.description}</p>
    </div>
  );
}

export default async function AboutPage() {
  const content = await getAboutPage();

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      <Section spacing="compact" aria-labelledby="about-intro-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <SectionHeading
              id="about-intro-heading"
              level={2}
              eyebrow="Introduction"
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
        </Container>
      </Section>

      <ProseSection
        id="story"
        tone="muted"
        eyebrow={content.story.eyebrow}
        heading={content.story.heading}
        {...(content.story.description === undefined
          ? {}
          : { description: content.story.description })}
        body={content.story.body}
        image={content.story.image}
      />

      <Section aria-labelledby="mission-heading">
        <Container className="flex flex-col gap-9">
          <SectionHeading
            id="mission-heading"
            level={2}
            eyebrow="Mission"
            title={content.mission.heading}
            description={content.mission.body}
          />

          <ul className="grid gap-4 sm:grid-cols-3">
            {content.mission.points.map((point) => {
              const [label, ...rest] = point.split(':');
              const detail = rest.join(':').trim();

              return (
                <li
                  key={point}
                  className="flex flex-col gap-1.5 rounded-2xl border border-sand bg-ivory/70 p-5"
                >
                  <span className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
                    {label}
                  </span>
                  <span className="text-body-sm text-charcoal/90">{detail}</span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-6 pt-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-subheading text-cocoa">{content.values.heading}</h3>
              <p className="text-body-sm max-w-[60ch] text-charcoal/90">
                {content.values.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.values.items.map((value) => (
                <ValueCard key={value.id} value={value} />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <ProseSection
        id="care"
        tone="muted"
        reverse
        eyebrow={content.care.eyebrow}
        heading={content.care.heading}
        {...(content.care.description === undefined
          ? {}
          : { description: content.care.description })}
        body={content.care.body}
        image={content.care.image}
      />

      <CtaPanel content={content.cta} />
    </>
  );
}
