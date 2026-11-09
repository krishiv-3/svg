import { HeartIcon } from '@/components/icons';
import { ButtonLink, Container, Section } from '@/components/ui';

import type { HomepageFinalCta } from '@/content';

/**
 * Final call to action.
 *
 * A single cocoa panel closes the page with the strongest ask. It sits inside an
 * ivory section so it reads as a distinct object rather than merging into the
 * footer, and the note repeats that no payment is processed yet.
 */
export function FinalCtaSection({ finalCta }: { finalCta: HomepageFinalCta }) {
  return (
    <Section id="donate" aria-labelledby="final-cta-heading">
      <Container>
        <div className="bg-cocoa relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="bg-[image:var(--gradient-hero-bloom)] pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
          />
          <div
            aria-hidden="true"
            className="bg-[image:var(--gradient-hero-glow)] pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          />

          <div className="relative mx-auto flex max-w-[46rem] flex-col items-center gap-4">
            <h2 id="final-cta-heading" className="text-title text-ivory">
              {finalCta.heading}
            </h2>

            <p className="text-body max-w-[52ch] text-ivory/80">{finalCta.description}</p>

            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <ButtonLink
                href={finalCta.primary.href}
                size="lg"
                iconLeft={<HeartIcon size={18} />}
                className="cta-gradient shadow-soft"
              >
                {finalCta.primary.label}
              </ButtonLink>
              <ButtonLink href={finalCta.secondary.href} variant="inverse" size="lg">
                {finalCta.secondary.label}
              </ButtonLink>
            </div>

            <p className="text-[length:var(--text-caption)] text-ivory/55">{finalCta.note}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
