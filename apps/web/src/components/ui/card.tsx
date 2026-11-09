import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Card — the default content container.
 *
 * Three surfaces only: white (default), sand (muted grouping) and cocoa
 * (inverse, used sparingly for emphasis). Elevation is a single soft shadow;
 * the design system deliberately avoids stacked shadows.
 */

export type CardTone = 'default' | 'muted' | 'inverse';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const TONES: Record<CardTone, string> = {
  default: 'border-sand bg-white text-charcoal shadow-soft',
  muted: 'border-sand bg-sand/40 text-charcoal',
  inverse: 'border-cocoa bg-cocoa text-ivory',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /** Adds hover feedback; only use when the whole card is a link. */
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({
  tone = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-xl border',
        TONES[tone],
        PADDING[padding],
        interactive
          ? 'transition-shadow duration-200 ease-standard hover:shadow-raised focus-within:shadow-raised'
          : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}
