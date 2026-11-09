import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ImageContainer } from '@/components/ui';

/**
 * Hero foundation.
 *
 * A reusable composition, not the homepage: warm ambient light, a generous
 * display heading, one primary action, one quiet secondary action, and an image
 * panel with an optional floating glass card.
 *
 * The light is drawn with two very soft radial gradients using the palette's
 * warm tones. Nothing here is a fixed marketing claim — all copy is passed in,
 * and the demo showcase supplies clearly labelled demonstration content.
 *
 * Motion: a short staggered entrance that is automatically disabled by the
 * global `prefers-reduced-motion` rule.
 */

export interface HeroAside {
  label: string;
  value: string;
  note?: string;
}

export interface HeroProps {
  eyebrow?: string;
  heading: ReactNode;
  description: ReactNode;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
  /** Describes the image slot; the placeholder is labelled with this text. */
  imageLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  aside?: HeroAside;
  /** Small print under the actions, e.g. a demonstration notice. */
  footnote?: ReactNode;
  className?: string;
}

export function Hero({
  eyebrow,
  heading,
  description,
  primaryCta,
  secondaryCta,
  imageLabel = 'Hero photograph',
  imageSrc,
  imageAlt,
  aside,
  footnote,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-ivory',
        'px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-28',
        className,
      )}
    >
      {/* Ambient warm light. Decorative, never interactive. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[image:var(--gradient-hero-bloom)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 right-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-[image:var(--gradient-hero-glow)] blur-3xl"
      />

      <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          {eyebrow === undefined ? null : (
            <p className="glass reveal-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
              {eyebrow}
            </p>
          )}

          <h1 className="reveal-up reveal-up-1 text-display max-w-[16ch] text-cocoa">{heading}</h1>

          <p className="reveal-up reveal-up-2 text-lead max-w-[46ch] text-charcoal/90">
            {description}
          </p>

          {(primaryCta !== undefined || secondaryCta !== undefined) && (
            <div className="reveal-up reveal-up-3 flex flex-wrap items-center gap-3">
              {primaryCta}
              {secondaryCta}
            </div>
          )}

          {footnote === undefined ? null : (
            <p className="reveal-up reveal-up-3 text-[length:var(--text-caption)] text-muted">
              {footnote}
            </p>
          )}
        </div>

        <div className="relative">
          {/* A soft halo behind the image panel. */}
          <div
            aria-hidden="true"
            className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(60%_60%_at_60%_40%,rgba(217,119,50,0.18),rgba(255,248,239,0)_70%)] blur-2xl"
          />

          <div className="overflow-hidden rounded-3xl border border-white/60 shadow-glass">
            <ImageContainer
              {...(imageSrc === undefined ? {} : { src: imageSrc })}
              {...(imageAlt === undefined ? {} : { alt: imageAlt })}
              aspect="4/3"
              placeholderLabel={imageLabel}
              priority
              flush
            />
          </div>

          {aside === undefined ? null : (
            <div className="glass-strong absolute -bottom-5 left-4 max-w-[15rem] rounded-2xl px-4 py-3 sm:left-6">
              <p className="text-[length:var(--text-caption)] font-medium tracking-wide text-muted uppercase">
                {aside.label}
              </p>
              <p className="text-[length:var(--text-heading)] leading-none font-semibold text-cocoa tabular-nums">
                {aside.value}
              </p>
              {aside.note === undefined ? null : (
                <p className="mt-1 text-[length:var(--text-caption)] text-muted">{aside.note}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
