import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Badges — short status or category labels.
 *
 * Never colour-only: the text itself carries the meaning, and the tone only
 * reinforces it (WCAG 1.4.1).
 */

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-sand bg-sand/50 text-cocoa',
  brand: 'border-terracotta/30 bg-terracotta/10 text-terracotta-ink',
  accent: 'border-brass/45 bg-brass/15 text-cocoa',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[length:var(--text-caption)]',
  md: 'px-2.5 py-1 text-[length:var(--text-label)]',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
