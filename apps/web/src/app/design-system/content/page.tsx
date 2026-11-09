import type { Metadata } from 'next';

import {
  DEMO_ACTIVITIES,
  DEMO_CAMPAIGNS,
  DEMO_CONTACT,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_HERO,
  DEMO_INTRODUCTION,
  DEMO_NEWS,
  DEMO_SEO,
  DEMO_STATISTICS,
  DEMO_TESTIMONIALS,
  type DemoActivityIcon,
} from '@/demo';

import { CameraIcon, HeartIcon, MapPinIcon, MegaphoneIcon, UsersIcon } from '@/components/icons';
import { DemoBanner, DemoFrame } from '@/components/demo/demo-frame';
import {
  ActivityCard,
  ButtonLink,
  CampaignCard,
  Card,
  Container,
  EventCard,
  GalleryCard,
  ImageContainer,
  NewsCard,
  PageHeader,
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
  PRIMARY_NAV,
  SiteFooter,
  SiteHeader,
} from '@/components/site';

/**
 * Content-component reference with demonstration data.
 *
 * This page exists so the card system can be evaluated with realistic content
 * before the CMS exists. Every block is wrapped in a `DemoFrame` and marked
 * `data-demo`; nothing here is a claim about the organisation.
 */

export const metadata: Metadata = {
  title: 'Content components (demo)',
  robots: { index: false, follow: false },
};

const ACTIVITY_ICONS: Record<DemoActivityIcon, React.ReactNode> = {
  nourishment: <HeartIcon size={20} />,
  care: <HeartIcon size={20} />,
  shelter: <MapPinIcon size={20} />,
  community: <UsersIcon size={20} />,
};

function SectionIntro({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return <SectionHeading id={id} title={title} description={description} level={2} />;
}

export default function ContentComponentsPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader navItems={PRIMARY_NAV} activeHref="/design-system/content" />

      <main id="main-content">
        <Section tone="muted" spacing="compact">
          <Container className="flex flex-col gap-5">
            <PageHeader
              title="Content components"
              description="Cards and content patterns rendered with demonstration data, so spacing, hierarchy and imagery placeholders can be judged before real content exists."
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Design system', href: '/design-system' },
                { label: 'Content components' },
              ]}
              actions={
                <ButtonLink href="/design-system" variant="secondary" size="sm">
                  Back to design system
                </ButtonLink>
              }
            />
            <DemoBanner />
          </Container>
        </Section>

        {/* ------------------------------------------------------------- hero */}
        <Section spacing="compact" aria-labelledby="hero-preview">
          <Container className="flex flex-col gap-6">
            <SectionIntro
              id="hero-preview"
              title="Hero content"
              description="The intended homepage hero treatment, shown in a bounded frame. The homepage itself is built in Phase 4."
            />

            <DemoFrame label="Hero copy and calls to action">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
                <div className="flex flex-col gap-5">
                  <p className="text-overline text-terracotta-ink uppercase">Gaushala · demo</p>
                  <p className="text-display text-cocoa">{DEMO_HERO.heading}</p>
                  <p className="text-lead max-w-[46ch] text-charcoal/90">{DEMO_HERO.description}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <DonateCta size="lg" />
                    <ButtonLink href={DEMO_HERO.secondaryCta.href} variant="outline" size="lg">
                      {DEMO_HERO.secondaryCta.label}
                    </ButtonLink>
                  </div>
                </div>

                <ImageContainer
                  aspect="4/3"
                  placeholderLabel="Demo photograph — gaushala life"
                  rounded="xl"
                />
              </div>
            </DemoFrame>
          </Container>
        </Section>

        {/* ------------------------------------------------------- activities */}
        <Section tone="muted" spacing="compact" aria-labelledby="cards">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="cards"
              title="Activity cards"
              description="Four equal-height cards with an icon, a heading, a short description and an optional link."
            />

            <DemoFrame label="Activity cards">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-demo="true">
                {DEMO_ACTIVITIES.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    description={activity.description}
                    icon={ACTIVITY_ICONS[activity.icon]}
                    demo
                  />
                ))}
              </div>
            </DemoFrame>
          </Container>
        </Section>

        {/* ------------------------------------------------------- statistics */}
        <Section spacing="compact" aria-labelledby="statistics">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="statistics"
              title="Impact statistics"
              description="Every figure must carry a reporting period and source in production. These are illustrative placeholders."
            />

            <DemoFrame label="Statistic cards">
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
            </DemoFrame>

            <Card tone="muted" padding="md">
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                Production rule
              </p>
              <p className="text-[length:var(--text-caption)] text-muted">
                Impact statistics cannot be published until they are verified, with a methodology
                and a reporting period recorded in the CMS. Empty sections render nothing rather
                than a placeholder number.
              </p>
            </Card>
          </Container>
        </Section>

        {/* -------------------------------------------------------- campaigns */}
        <Section tone="muted" spacing="compact" aria-labelledby="campaigns">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="campaigns"
              title="Campaign cards"
              description="Progress is expressed with a labelled progress bar and exact amounts. Amounts arrive in minor units from the API, never as formatted strings."
            />

            <DemoFrame label="Campaign cards">
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
                    demo
                  />
                ))}
              </div>
            </DemoFrame>

            <Card tone="default" padding="md" className="flex items-start gap-3">
              <MegaphoneIcon size={20} className="mt-0.5 shrink-0 text-terracotta-ink" />
              <p className="text-[length:var(--text-caption)] text-muted">
                No donation can be made from this page. Online payments stay disabled until the bank
                integration is implemented and approved.
              </p>
            </Card>
          </Container>
        </Section>

        {/* ----------------------------------------------------------- events */}
        <Section spacing="compact" aria-labelledby="events">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="events"
              title="Event cards"
              description="A date block, a machine-readable time element and explicit status so cancelled events can never look active."
            />

            <DemoFrame label="Event cards">
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
                    demo
                  />
                ))}
              </div>
            </DemoFrame>
          </Container>
        </Section>

        {/* ------------------------------------------------------------- news */}
        <Section tone="muted" spacing="compact" aria-labelledby="news">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="news"
              title="News cards"
              description="Image, category, date, title and excerpt. The whole card is one link, with the title as the accessible name."
            />

            <DemoFrame label="News cards">
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
                    demo
                  />
                ))}
              </div>
            </DemoFrame>
          </Container>
        </Section>

        {/* ---------------------------------------------------------- gallery */}
        <Section spacing="compact" aria-labelledby="gallery">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="gallery"
              title="Gallery cards"
              description="Square tiles keep the grid even regardless of source aspect ratio. Captions are always editable and always rendered."
            />

            <DemoFrame label="Gallery cards">
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
            </DemoFrame>
          </Container>
        </Section>

        {/* ----------------------------------------------------- testimonials */}
        <Section tone="muted" spacing="compact" aria-labelledby="testimonials">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="testimonials"
              title="Testimonial cards"
              description="Testimonials are always attributed and always require recorded consent before publication."
            />

            <DemoFrame label="Testimonial cards">
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
            </DemoFrame>
          </Container>
        </Section>

        {/* --------------------------------------------------------- contact */}
        <Section spacing="compact" aria-labelledby="contact">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="contact"
              title="Contact and introduction"
              description="Contact details are never invented. Until they are verified, the block states that they are pending."
            />

            <DemoFrame label="Introduction and contact block">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card padding="lg" className="flex flex-col gap-3">
                  <p className="text-overline text-terracotta-ink uppercase">
                    {DEMO_INTRODUCTION.eyebrow}
                  </p>
                  <p className="text-heading text-cocoa">{DEMO_INTRODUCTION.heading}</p>
                  <p className="text-body text-charcoal/90">{DEMO_INTRODUCTION.body}</p>
                  <ButtonLink href="/about" variant="outline" size="sm" className="self-start">
                    More about us
                  </ButtonLink>
                </Card>

                <Card tone="muted" padding="lg" className="flex flex-col gap-3">
                  <p className="text-subheading text-cocoa">{DEMO_CONTACT.heading}</p>
                  <p className="text-body-sm text-charcoal/90">{DEMO_CONTACT.note}</p>
                  <dl className="text-[length:var(--text-caption)] text-muted">
                    {DEMO_CONTACT.lines.map((line) => (
                      <div key={line.label}>
                        <dt className="font-medium text-cocoa">{line.label}</dt>
                        <dd>{line.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2 flex items-center gap-2 text-[length:var(--text-caption)] text-muted">
                    <CameraIcon size={14} />
                    Photographs and contact details are supplied in Phase 10.
                  </div>
                </Card>
              </div>
            </DemoFrame>
          </Container>
        </Section>

        {/* ------------------------------------------------------------- seo */}
        <Section tone="muted" spacing="compact" aria-labelledby="seo">
          <Container className="flex flex-col gap-8">
            <SectionIntro
              id="seo"
              title="Metadata shapes"
              description="Illustrative title and description patterns for future routes. Each page will generate these from CMS fields with sensible defaults."
            />

            <DemoFrame label="SEO metadata examples">
              <div className="overflow-x-auto rounded-lg border border-sand bg-white">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <caption className="visually-hidden">
                    Illustrative SEO titles and descriptions for future routes
                  </caption>
                  <thead>
                    <tr className="border-b border-sand bg-ivory/70">
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-[length:var(--text-caption)] font-semibold tracking-wide text-cocoa uppercase"
                      >
                        Route
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-[length:var(--text-caption)] font-semibold tracking-wide text-cocoa uppercase"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-[length:var(--text-caption)] font-semibold tracking-wide text-cocoa uppercase"
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_SEO.map((entry) => (
                      <tr key={entry.route} className="border-b border-sand/70 last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-[length:var(--text-caption)] text-cocoa">
                          {entry.route}
                        </td>
                        <td className="px-4 py-2.5 text-[length:var(--text-caption)] text-charcoal">
                          {entry.title}
                        </td>
                        <td className="px-4 py-2.5 text-[length:var(--text-caption)] text-muted">
                          {entry.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DemoFrame>
          </Container>
        </Section>
      </main>

      <SiteFooter
        columns={FOOTER_NAV}
        tagline="Design-system reference. All content on this page is demonstration data."
        contact={<FooterContact lines={[]} />}
        legalNote={
          <span className="text-[length:var(--text-caption)] text-ivory/60">
            Internal reference page · not indexed
          </span>
        }
      />
    </>
  );
}
