import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ImageIcon } from '../icons';

/**
 * Image container.
 *
 * Two jobs:
 *  1. Hold a real image with a reserved aspect ratio, so images never cause
 *     layout shift (a Core Web Vitals requirement).
 *  2. Hold an explicit, clearly-labelled placeholder until authentic Gaushala
 *     photography is supplied. The placeholder must never be mistakable for a
 *     real photograph of the Gaushala — this is a hard rule from the blueprint.
 *
 * Real images arrive from the media pipeline in Phase 6; until then every
 * instance renders the labelled placeholder.
 */

export type ImageAspect = '16/9' | '4/3' | '3/2' | '4/5' | '1/1';

const ASPECT: Record<ImageAspect, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '4/5': 'aspect-[4/5]',
  '1/1': 'aspect-square',
};

export interface ImageContainerProps {
  /** Absolute or root-relative image URL. Omit to render the placeholder. */
  src?: string;
  /** Required whenever `src` is provided. */
  alt?: string;
  aspect?: ImageAspect;
  /** Shown under the frame; also useful for captions from the CMS. */
  caption?: ReactNode;
  /** Describes what this slot will hold, e.g. "Campaign cover photograph". */
  placeholderLabel?: string;
  /** Above-the-fold images disable lazy loading. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  /** Removes the border and radius so the image can sit flush inside a card. */
  flush?: boolean;
}

const ROUNDED: Record<NonNullable<ImageContainerProps['rounded']>, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
};

export function ImageContainer({
  src,
  alt,
  aspect = '16/9',
  caption,
  placeholderLabel = 'Image placeholder',
  priority = false,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  className,
  rounded = 'lg',
  flush = false,
}: ImageContainerProps) {
  const hasImage = src !== undefined && src !== '';

  if (hasImage && (alt === undefined || alt.trim() === '')) {
    // Fail loudly in development rather than shipping an unlabelled image.
    throw new Error('ImageContainer: `alt` is required when `src` is provided.');
  }

  return (
    <figure className={cn('flex flex-col gap-2.5', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden bg-sand/40',
          flush ? undefined : 'border border-sand',
          ASPECT[aspect],
          flush ? undefined : ROUNDED[rounded],
        )}
      >
        {hasImage ? (
          <Image
            src={src}
            alt={alt ?? ''}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`${placeholderLabel}: no approved photograph supplied yet`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sand/25 bg-[repeating-linear-gradient(135deg,rgba(233,215,195,0.55)_0px,rgba(233,215,195,0.55)_12px,transparent_12px,transparent_24px)] text-center"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_40%,rgba(255,248,239,0.85),rgba(255,248,239,0)_75%)]"
            />
            <ImageIcon size={26} className="relative text-cocoa/60" />
            <span className="relative text-[length:var(--text-caption)] font-medium tracking-wide text-cocoa/75 uppercase">
              {placeholderLabel}
            </span>
            <span className="relative max-w-[24ch] text-[length:var(--text-caption)] text-cocoa/60">
              Awaiting approved photograph
            </span>
          </div>
        )}
      </div>

      {caption === undefined ? null : (
        <figcaption className="text-[length:var(--text-caption)] text-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
