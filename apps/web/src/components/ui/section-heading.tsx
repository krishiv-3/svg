import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Section heading.
 *
 * Encapsulates the eyebrow → heading → description rhythm so every section on
 * the site shares one hierarchy. The heading level is explicit (never inferred)
 * so the document outline stays correct.
 */

export interface SectionHeadingProps {
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** `1` only for a page's main heading. */
  level?: 1 | 2 | 3;
  align?: 'left' | 'center';
  /** `id` used by the section's `aria-labelledby`. */
  id?: string;
  /** Buttons or links aligned to the heading on wide screens. */
  actions?: ReactNode;
  className?: string;
}

const TITLE_CLASS: Record<1 | 2 | 3, string> = {
  1: 'text-title text-cocoa',
  2: 'text-heading text-cocoa',
  3: 'text-subheading text-cocoa',
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = 2,
  align = 'left',
  id,
  actions,
  className,
}: SectionHeadingProps) {
  const Heading = `h${String(level)}` as 'h1' | 'h2' | 'h3';

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start',
        actions !== undefined && align === 'left'
          ? 'sm:flex-row sm:items-end sm:justify-between'
          : undefined,
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3',
          align === 'center' ? 'items-center' : 'items-start',
          actions === undefined ? undefined : 'sm:max-w-2xl',
        )}
      >
        {eyebrow === undefined ? null : (
          <p className="text-overline text-terracotta-ink uppercase">{eyebrow}</p>
        )}

        <Heading id={id} className={TITLE_CLASS[level]}>
          {title}
        </Heading>

        {description === undefined ? null : (
          <p className="text-lead text-charcoal/90 max-w-[60ch]">{description}</p>
        )}
      </div>

      {actions === undefined ? null : <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}
