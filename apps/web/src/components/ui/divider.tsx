import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Divider — separates groups of content.
 *
 * Without a label it renders a semantic `<hr>`. With a label it renders a
 * labelled separator so the label is not read as unrelated text.
 */

export type DividerSpacing = 'sm' | 'md' | 'lg';

const SPACING: Record<DividerSpacing, string> = {
  sm: 'my-4',
  md: 'my-8',
  lg: 'my-12',
};

export interface DividerProps {
  label?: ReactNode;
  spacing?: DividerSpacing;
  /** Use on dark surfaces. */
  tone?: 'default' | 'inverse';
  className?: string;
}

export function Divider({ label, spacing = 'md', tone = 'default', className }: DividerProps) {
  const line = tone === 'inverse' ? 'bg-ivory/20' : 'bg-sand';

  if (label === undefined) {
    return <hr className={cn('h-px w-full border-0', line, SPACING[spacing], className)} />;
  }

  return (
    <div
      role="separator"
      aria-label={typeof label === 'string' ? label : undefined}
      className={cn('flex items-center gap-3', SPACING[spacing], className)}
    >
      <span className={cn('h-px flex-1', line)} aria-hidden="true" />
      <span
        className={cn(
          'text-[length:var(--text-caption)] font-medium tracking-wide uppercase',
          tone === 'inverse' ? 'text-ivory/70' : 'text-muted',
        )}
      >
        {label}
      </span>
      <span className={cn('h-px flex-1', line)} aria-hidden="true" />
    </div>
  );
}
