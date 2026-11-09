import type { Metadata } from 'next';

import {
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_NEWS,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
  type DemoActivityIcon,
} from '@/demo';

import { DemoBanner } from '@/components/demo/demo-frame';
import { CameraIcon, HeartIcon, MapPinIcon, MegaphoneIcon, UsersIcon } from '@/components/icons';
import {
  ActivityCard,
  Button,
  ButtonLink,
  CampaignCard,
  Container,
  EventCard,
  GalleryCard,
  NewsCard,
  Pagination,
  Section,
  SectionHeading,
  SkipLink,
  StatisticCard,
  TestimonialCard,
} from '@/components/ui';
import {
  DonateCta,
  FOOTER_NAV,
  FooterContact,
  Hero,
  PRIMARY_NAV,
  SiteFooter,
  SiteHeader,
} from '@/components/site';

/**
 * Visual redesign showcase.
 *
 * Internal, `noindex`, and separate from the production homepage. It exists so
 * the premium surfaces — floating glass header, hero foundation, card family,
 * glass panels and the heritage footer — can be reviewed together with real
 * components and clearly marked demonstration content.
 */

export const metadata: Metadata = {
  title: 'Visual showcase (demo)',
  robots: { index: false, follow: false },
};

const ACTIVITY_ICONS: Record<DemoActivityIcon, React.ReactNode> = {
  nourishment: <HeartIcon size={22} />,
  care: <HeartIcon size={22} />,
  shelter: <MapPinIcon size={22} />,
  community: <UsersIcon size={22} />,
};

const ACTIVITY_BULLETS: Record<DemoActivityIcon, readonly string[]> = {
  nourishment: ['Balanced daily feed', 'Clean water', 'Seasonal adjustments'],
  care: ['Routine health checks', 'Quiet recovery space', 'Individual attention'],
  shelter: ['Shade and ventilation', 'Winter warmth', 'Safe flooring'],
  community: ['Guided visits', 'Volunteer mornings', 'Learning sessions'],
};

export default function VisualShowcasePage() {
  return (
    <>
      <SkipLink />
      <SiteHeader navItems={PRIMARY_NAV} activeHref="/design-system/visual" />

      <main id="main-content">
        {/* ----------------------------------------------------------- hero */}
        <div id="hero" className="scroll-mt-28">
          <Hero
            eyebrow="Gaushala · demonstration"
            heading={DEMO_HERO.heading}
            description={DEMO_HERO.description}
            primaryCta={<DonateCta size="lg" />}
            secondaryCta={
              <ButtonLink href="/our-work" variant="secondary" size="lg">
                {DEMO_HERO.secondaryCta.label}
              </ButtonLink>
            }
            imageLabel="Demo photograph — gaushala life"
            aside={{ label: 'Cows under care', value: '120', note: 'Illustrative figure' }}
            footnote="Demonstration content — not a verified claim about the organisation."
          />
        </div>

        <Container className="pt-2 pb-10">
          <DemoBanner />
        </Container>

        {/* ---------------------------------------------------------- cards */}
        <Section id="cards" tone="muted" spacing="compact">
          <Container className="flex flex-col gap-8">
            <SectionHeading
              level={2}
              eyebrow="Card system"
              title="Activity cards"
              description="Gradient icon tile, clear hierarchy, supporting points and a quiet hover lift. Every card is the same component used by the future CMS pages."
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {DEMO_ACTIVITIES.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  icon={ACTIVITY_ICONS[activity.icon]}
                  bullets={ACTIVITY_BULLETS[activity.icon]}
                  link={{ href: '/our-work', label: 'Learn more' }}
                  demo
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {DEMO_STATISTICS.map((statistic) => (
                <StatisticCard
                  key={statistic.id}
                  value={statistic.value}
                  {...(statistic.unit === undefined ? {} : { unit: statistic.unit })}
                  label={statistic.label}
                  note={statistic.note}
                  demo
                />
              ))}
            </div>
          </Container>
        </Section>

        {/* ------------------------------------------------------ campaigns */}
        <Section id="campaigns" spacing="compact">
          <Container className="flex flex-col gap-8">
            <SectionHeading
              level={2}
              eyebrow="Fundraising"
              title="Campaign cards"
              description="Image-led, with the status as a glass pill and progress expressed as real data rather than a decorative bar."
              actions={
                <ButtonLink href="/campaigns" variant="outline" size="sm">
                  All campaigns
                </ButtonLink>
              }
            />

            <div className="grid gap-5 md:grid-cols-2">
              {DEMO_CAMPAIGNS.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  title={campaign.title}
                  purpose={campaign.purpose}
                  raisedMinor={campaign.raisedMinor}
                  goalMinor={campaign.goalMinor}
                  status={campaign.status}
                  imageLabel={campaign.imageLabel}
                  link={{ href: '/campaigns', label: 'Support this campaign' }}
                  demo
                />
              ))}
            </div>

            <p className="text-[length:var(--text-caption)] text-muted">
              Online donations are disabled in this phase. No payment can be made from any page.
            </p>
          </Container>
        </Section>

        {/* --------------------------------------------------- news + events */}
        <Section id="news-events" tone="muted" spacing="compact">
          <Container className="flex flex-col gap-10">
            <div className="flex flex-col gap-8">
              <SectionHeading
                level={2}
                eyebrow="Editorial"
                title="News cards"
                description="Editorial image ratio, category, date and a read link that moves on hover."
              />

              <div className="grid gap-5 md:grid-cols-3">
                {DEMO_NEWS.map((article) => (
                  <NewsCard
                    key={article.id}
                    title={article.title}
                    excerpt={article.excerpt}
                    category={article.category}
                    dateLabel={article.dateLabel}
                    dateTime={article.dateTime}
                    imageLabel="Demo photograph — article cover"
                    link={{ href: '/news', label: 'Read article' }}
                    demo
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <SectionHeading
                level={2}
                eyebrow="What's on"
                title="Event cards"
                description="A warm gradient date tile keeps the date scannable while the status stays explicit."
              />

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {DEMO_EVENTS.map((event) => (
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
                    demo
                  />
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* --------------------------------------------------------- gallery */}
        <Section id="gallery" spacing="compact">
          <Container className="flex flex-col gap-8">
            <SectionHeading
              level={2}
              eyebrow="Media"
              title="Gallery and testimonial cards"
              description="Image-first tiles with a hover scrim, and an editorial testimonial layout that keeps attribution visible."
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {DEMO_GALLERY.map((item) => (
                <GalleryCard
                  key={item.id}
                  caption={item.caption}
                  category={item.category}
                  imageLabel="Demo photograph"
                  demo
                />
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {DEMO_TESTIMONIALS.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  quote={testimonial.quote}
                  name={testimonial.name}
                  context={testimonial.context}
                  demo
                />
              ))}
            </div>
          </Container>
        </Section>

        {/* ---------------------------------------------------- glass + CTA */}
        <Section id="glass" tone="muted" spacing="compact">
          <Container className="flex flex-col gap-8">
            <SectionHeading
              level={2}
              eyebrow="Surfaces"
              title="Glass panels and actions"
              description="Translucent warm surfaces over ambient light, with a solid fallback when backdrop blur is unavailable."
            />

            <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-hero-bloom)] p-6 sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-[image:var(--gradient-hero-glow)] blur-3xl"
              />

              <div className="relative grid gap-5 sm:grid-cols-2">
                <div className="glass rounded-2xl p-6">
                  <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
                    Glass surface
                  </p>
                  <p className="text-subheading mt-2 text-cocoa">72% warm ivory</p>
                  <p className="text-body-sm mt-1 text-charcoal/85">
                    Used for the floating header, overlays and small information panels where the
                    page behind should still be felt.
                  </p>
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
                    Strong glass
                  </p>
                  <p className="text-subheading mt-2 text-cocoa">88% warm ivory</p>
                  <p className="text-body-sm mt-1 text-charcoal/85">
                    For panels that carry real copy — higher opacity, stronger blur, and a finer
                    border so text contrast never depends on what is behind it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-sand bg-white p-6 shadow-soft sm:p-8">
              <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                Actions
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  iconLeft={<HeartIcon size={18} />}
                  className="cta-gradient shadow-soft"
                >
                  Donate now
                </Button>
                <Button size="lg" variant="secondary">
                  Secondary
                </Button>
                <Button size="lg" variant="outline">
                  Outline
                </Button>
                <Button size="lg" variant="ghost">
                  Ghost
                </Button>
                <Button size="lg" variant="danger">
                  Destructive
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button size="sm" variant="secondary" iconLeft={<MegaphoneIcon size={14} />}>
                  Small action
                </Button>
                <Button size="sm" isLoading>
                  Saving
                </Button>
                <Button size="sm" disabled>
                  Disabled
                </Button>
                <ButtonLink
                  href="/donate"
                  variant="outline"
                  size="sm"
                  iconLeft={<CameraIcon size={14} />}
                >
                  Link styled as a button
                </ButtonLink>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-sand bg-white p-6 shadow-soft">
              <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-muted uppercase">
                Pagination
              </p>
              <Pagination
                currentPage={2}
                totalPages={7}
                hrefFor={(page) => `#page-${String(page)}`}
              />
            </div>
          </Container>
        </Section>
      </main>

      <SiteFooter
        columns={FOOTER_NAV}
        tagline="A demonstration layout for the design system. Organisation copy, photography and verified contact details are supplied before launch."
        contact={<FooterContact lines={[]} />}
        socialLinks={[
          { label: 'Instagram (demonstration link)', href: '#', network: 'instagram' },
          { label: 'YouTube (demonstration link)', href: '#', network: 'youtube' },
          { label: 'X (demonstration link)', href: '#', network: 'x' },
        ]}
        legalNote={
          <span className="text-[length:var(--text-caption)] text-muted">
            Internal reference page · not indexed
          </span>
        }
      />
    </>
  );
}
