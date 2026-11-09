import { HeartIcon } from '@/components/icons';
import { ButtonLink, Container, Section } from '@/components/ui';

import type { CtaPanel as CtaPanelContent } from '@/content/library';

/**
 * Closing donation panel.
 *
 * Shared by the secondary pages so the ask is consistent: one cocoa panel, one
 * primary action, one quiet secondary action and an explicit note that online
 * giving is not open yet.
 */
export function CtaPanel({ content }: { content: CtaPanelContent }) {
  return (
    <Section spacing="compact">
      <Container>
        <div className="bg-cocoa relative overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="bg-[image:var(--gradient-hero-glow)] pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-50 blur-3xl"
          />

          <div className="relative mx-auto flex max-w-[44rem] flex-col items-center gap-3">
            <h2 className="text-title text-ivory">{content.heading}</h2>
            <p className="text-body max-w-[50ch] text-ivory/80">{content.description}</p>

            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <ButtonLink
                href={content.cta.href}
                size="lg"
                iconLeft={<HeartIcon size={18} />}
                className="cta-gradient shadow-soft"
              >
                {content.cta.label}
              </ButtonLink>

              {content.secondary === undefined ? null : (
                <ButtonLink href={content.secondary.href} variant="inverse" size="lg">
                  {content.secondary.label}
                </ButtonLink>
              )}
            </div>

            {content.note === undefined ? null : (
              <p className="text-[length:var(--text-caption)] text-ivory/55">{content.note}</p>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
