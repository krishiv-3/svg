import type { Metadata } from 'next';

import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons';
import { Container, Section, SectionHeading } from '@/components/ui';
import { PageHero } from '@/components/site';
import { ContactForm } from '@/components/contact/contact-form';

import { getContactPage } from '@/content';
import type { ContactChannel } from '@/content/library';

/**
 * Contact.
 *
 * Contact channels are laid out for real values but every one of them is pending:
 * no address, phone number or email is invented. The enquiry form validates
 * locally and states plainly that nothing is sent.
 */

// Rendered on demand: content lives in the database, so the build must not
// require a running API. The content loaders cache their fetches instead.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContactPage();

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/contact' },
    robots: { index: false, follow: false },
  };
}

const CHANNEL_ICONS = {
  map: MapPinIcon,
  phone: PhoneIcon,
  mail: MailIcon,
} as const;

function ChannelCard({ channel }: { channel: ContactChannel }) {
  const Icon = CHANNEL_ICONS[channel.icon];

  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl border border-sand bg-white p-5 shadow-soft">
      <span className="bg-[image:var(--gradient-icon-tile)] ring-1 ring-white/60 ring-inset flex h-11 w-11 items-center justify-center rounded-xl text-terracotta-ink">
        <Icon size={20} />
      </span>

      <h3 className="text-subheading text-cocoa">{channel.label}</h3>

      {channel.value.length === 0 ? (
        <p className="text-body-sm text-muted">Not published yet</p>
      ) : (
        <p className="text-body-sm text-charcoal/90">{channel.value}</p>
      )}

      <p className="text-[length:var(--text-caption)] mt-auto text-muted">{channel.note}</p>
    </div>
  );
}

export default async function ContactPage() {
  const content = await getContactPage();

  return (
    <>
      <PageHero
        {...(content.hero.eyebrow === undefined ? {} : { eyebrow: content.hero.eyebrow })}
        heading={content.hero.heading}
        description={content.hero.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      <Section spacing="compact">
        <Container className="flex flex-col gap-10">
          <p className="text-body max-w-[64ch] text-charcoal/90">{content.intro}</p>

          <ul className="grid gap-4 sm:grid-cols-3">
            {content.channels.map((channel) => (
              <li key={channel.id}>
                <ChannelCard channel={channel} />
              </li>
            ))}
          </ul>

          <div className="overflow-hidden rounded-2xl border border-sand bg-ivory/70">
            <div
              aria-hidden="true"
              className="bg-[repeating-linear-gradient(45deg,rgba(233,215,195,0.45)_0px,rgba(233,215,195,0.45)_14px,transparent_14px,transparent_28px)] flex h-48 items-center justify-center sm:h-64"
            >
              <span className="flex flex-col items-center gap-2 px-6 text-center">
                <MapPinIcon size={26} className="text-cocoa/60" />
                <span className="text-[length:var(--text-label)] font-medium text-cocoa/80">
                  Map placeholder
                </span>
              </span>
            </div>

            <p className="text-[length:var(--text-caption)] border-t border-sand bg-white px-4 py-3 text-muted">
              {content.mapNote}
            </p>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-14">
            <div className="flex flex-col gap-5">
              <SectionHeading
                level={2}
                eyebrow="Enquiry"
                title="Send a message"
                description="Tell us what you would like to know. The form is a preview of the final enquiry flow."
              />

              <ContactForm notice={content.notice} />
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-sand bg-white p-5 shadow-soft">
              <h2 className="text-subheading text-cocoa">Before you write</h2>

              <ul className="flex flex-col gap-3">
                {[
                  'Visits are arranged in advance and kept small, so the animals are not disturbed.',
                  'Volunteer places are limited and depend on the week’s work.',
                  'Donation and receipt questions will be answerable once giving opens.',
                ].map((item) => (
                  <li key={item} className="text-body-sm text-charcoal/90">
                    {item}
                  </li>
                ))}
              </ul>

              <p className="text-[length:var(--text-caption)] border-t border-sand pt-3 text-muted">
                No phone number, email address or postal address is published on this site yet.
              </p>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
