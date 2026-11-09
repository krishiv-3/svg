import { CheckIcon } from '@/components/icons';
import { Container, ImageContainer, Section, SectionHeading, TextLink } from '@/components/ui';

import type { HomepageAbout } from '@/content';

/**
 * Editorial introduction.
 *
 * Image on the left on wide screens, text on the right, with a short list of
 * commitments under the body copy. The image keeps a fixed aspect ratio so the
 * section does not shift when a real photograph arrives.
 */
export function AboutSection({ about }: { about: HomepageAbout }) {
  return (
    <Section id="about" aria-labelledby="about-heading">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div
              aria-hidden="true"
              className="bg-[radial-gradient(60%_60%_at_40%_40%,rgba(217,119,50,0.16),rgba(255,248,239,0)_70%)] absolute -inset-5 -z-10 rounded-[2.5rem] blur-2xl"
            />

            <div className="overflow-hidden rounded-3xl border border-white/60 shadow-glass">
              <ImageContainer
                {...(about.image.src === undefined ? {} : { src: about.image.src })}
                {...(about.image.alt === undefined ? {} : { alt: about.image.alt })}
                aspect="4/3"
                placeholderLabel={about.image.label}
                flush
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-5">
            <SectionHeading
              id="about-heading"
              level={2}
              {...(about.eyebrow === undefined ? {} : { eyebrow: about.eyebrow })}
              title={about.heading}
              {...(about.description === undefined ? {} : { description: about.description })}
            />

            <div className="flex max-w-[52ch] flex-col gap-3">
              {about.body.map((paragraph) => (
                <p key={paragraph} className="text-body text-charcoal/90">
                  {paragraph}
                </p>
              ))}
            </div>

            {about.points === undefined || about.points.length === 0 ? null : (
              <ul className="flex flex-col gap-2 pt-1">
                {about.points.map((point) => (
                  <li
                    key={point}
                    className="text-[length:var(--text-label)] flex items-start gap-2.5 text-charcoal/90"
                  >
                    <span className="bg-terracotta/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <CheckIcon size={12} className="text-terracotta-ink" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-2">
              <TextLink href={about.link.href}>{about.link.label}</TextLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
