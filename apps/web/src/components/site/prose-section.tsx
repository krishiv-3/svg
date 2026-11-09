import type { ReactNode } from 'react';

import { CheckIcon } from '@/components/icons';
import { Container, ImageContainer, Section, SectionHeading } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { ImageRef } from '@/content/homepage';

/**
 * Editorial prose section.
 *
 * A heading, optional eyebrow and description, one or more paragraphs, an
 * optional list and an optional image. `reverse` flips the two columns so a page
 * of several sections alternates rather than repeating the same block.
 *
 * Used by `/about` and `/our-work`; the image keeps a fixed aspect ratio so no
 * layout shift occurs when real photography replaces the placeholder.
 */
export interface ProseSectionProps {
  id?: string;
  eyebrow?: string;
  heading: string;
  description?: string;
  body: readonly string[];
  bullets?: readonly string[];
  image?: ImageRef;
  reverse?: boolean;
  tone?: 'default' | 'muted';
  actions?: ReactNode;
}

export function ProseSection({
  id,
  eyebrow,
  heading,
  description,
  body,
  bullets,
  image,
  reverse = false,
  tone = 'default',
  actions,
}: ProseSectionProps) {
  const headingId = `${id ?? heading.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-heading`;

  return (
    <Section id={id} tone={tone} aria-labelledby={headingId}>
      <Container>
        <div
          className={cn(
            'grid items-center gap-10',
            image === undefined ? undefined : 'lg:grid-cols-2 lg:gap-16',
          )}
        >
          {image !== undefined && reverse ? (
            <div className="overflow-hidden rounded-3xl border border-white/60 shadow-glass">
              <ImageContainer
                {...(image.src === undefined ? {} : { src: image.src })}
                {...(image.alt === undefined ? {} : { alt: image.alt })}
                aspect="4/3"
                placeholderLabel={image.label}
                flush
              />
            </div>
          ) : null}

          <div
            className={cn('flex flex-col items-start gap-4', image === undefined && 'max-w-[68ch]')}
          >
            <SectionHeading
              id={headingId}
              level={2}
              {...(eyebrow === undefined ? {} : { eyebrow })}
              title={heading}
              {...(description === undefined ? {} : { description })}
            />

            <div className="flex max-w-[60ch] flex-col gap-3">
              {body.map((paragraph) => (
                <p key={paragraph} className="text-body text-charcoal/90">
                  {paragraph}
                </p>
              ))}
            </div>

            {bullets === undefined || bullets.length === 0 ? null : (
              <ul className="flex flex-col gap-2 pt-1">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-[length:var(--text-label)] flex items-start gap-2.5 text-charcoal/90"
                  >
                    <span className="bg-terracotta/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <CheckIcon size={12} className="text-terracotta-ink" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}

            {actions === undefined ? null : <div className="pt-2">{actions}</div>}
          </div>

          {image !== undefined && !reverse ? (
            <div className="overflow-hidden rounded-3xl border border-white/60 shadow-glass">
              <ImageContainer
                {...(image.src === undefined ? {} : { src: image.src })}
                {...(image.alt === undefined ? {} : { alt: image.alt })}
                aspect="4/3"
                placeholderLabel={image.label}
                flush
              />
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
