import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Form section.
 *
 * Groups related fields under a heading with a consistent two-column rhythm on
 * wide screens and a single column on small ones. Long forms are easier to scan
 * and to resume after an interruption when they are chunked this way.
 */

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2;
  /** Optional aside rendered on the right (help text, links). */
  aside?: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  columns = 2,
  aside,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn('border-sand rounded-xl border bg-white p-5 shadow-soft sm:p-6', className)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[length:var(--text-subheading)] font-semibold text-cocoa">{title}</h2>
        {description === undefined ? null : (
          <p className="text-[length:var(--text-body-sm)] text-muted">{description}</p>
        )}
      </div>

      <div
        className={cn(
          'mt-5 grid gap-5',
          aside === undefined ? undefined : 'lg:grid-cols-[1fr_18rem]',
        )}
      >
        <div className={cn('grid gap-5', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
          {children}
        </div>

        {aside === undefined ? null : (
          <aside className="text-[length:var(--text-caption)] rounded-lg bg-ivory/70 p-4 text-muted">
            {aside}
          </aside>
        )}
      </div>
    </section>
  );
}
