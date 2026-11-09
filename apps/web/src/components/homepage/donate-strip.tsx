import { HeartIcon } from '@/components/icons';
import { ButtonLink, Container, Section } from '@/components/ui';

import type { HomepageDonateStrip } from '@/content';

/**
 * Mid-page donation prompt.
 *
 * Placed after the impact panel so the ask follows the evidence. The note makes
 * it explicit that online giving is not open yet — the button navigates to the
 * donation page, which explains the status rather than pretending to take money.
 */
export function DonateStrip({ strip }: { strip: HomepageDonateStrip }) {
  return (
    <Section spacing="compact" aria-labelledby="donate-strip-heading">
      <Container>
        <div className="flex flex-col gap-5 rounded-3xl border border-sand bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-[52ch]">
            <h2 id="donate-strip-heading" className="text-subheading text-cocoa">
              {strip.heading}
            </h2>
            <p className="text-body-sm mt-1.5 text-charcoal/90">{strip.description}</p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <ButtonLink
              href={strip.cta.href}
              size="md"
              iconLeft={<HeartIcon size={16} />}
              className="cta-gradient shadow-soft"
            >
              {strip.cta.label}
            </ButtonLink>
            <p className="text-[length:var(--text-caption)] text-muted">{strip.note}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
