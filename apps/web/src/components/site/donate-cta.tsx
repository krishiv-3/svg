'use client';

import { useEffect, useState } from 'react';

import { HeartIcon } from '@/components/icons';
import { ButtonLink, type ButtonSize } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Donation calls to action.
 *
 * The blueprint requires a prominent, repeated Donate CTA — in the header, the
 * hero, after the work/impact sections, the campaign feature, the pre-footer and
 * the footer — plus a sticky variant that never obstructs content.
 *
 * Rules encoded here:
 *  - one primary action colour (terracotta), never two competing CTAs;
 *  - the sticky bar is mobile-only, appears only after the user has started
 *    scrolling, and is removed from the DOM when hidden (so it cannot receive
 *    focus while invisible).
 */

export interface DonateCtaProps {
  href?: string;
  label?: string;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function DonateCta({
  href = '/donate',
  label = 'Donate',
  size = 'lg',
  fullWidth = false,
  className,
}: DonateCtaProps) {
  return (
    <ButtonLink
      href={href}
      size={size}
      fullWidth={fullWidth}
      iconLeft={<HeartIcon size={size === 'lg' ? 20 : 16} />}
      className={className}
    >
      {label}
    </ButtonLink>
  );
}

export interface StickyDonateCtaProps {
  href?: string;
  label?: string;
  /** Scroll distance in pixels before the bar appears. */
  revealAfter?: number;
}

export function StickyDonateCta({
  href = '/donate',
  label = 'Donate',
  revealAfter = 480,
}: StickyDonateCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setVisible(window.scrollY > revealAfter);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [revealAfter]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-sticky md:hidden',
        'border-t border-sand bg-ivory/95 backdrop-blur',
      )}
      style={{ padding: '0.75rem', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <ButtonLink href={href} fullWidth size="md" iconLeft={<HeartIcon size={16} />}>
        {label}
      </ButtonLink>
    </div>
  );
}
