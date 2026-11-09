import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ChevronRightIcon } from '../icons';

/**
 * Breadcrumbs.
 *
 * A real navigation landmark with an ordered list; the current page is marked
 * with `aria-current="page"` and is not a link. The separators are decorative
 * and hidden from assistive technology.
 */

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  /** Label for the navigation landmark. */
  label?: string;
  className?: string;
}

export function Breadcrumbs({ items, label = 'Breadcrumb', className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={label} className={cn('text-[length:var(--text-caption)]', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${String(index)}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRightIcon size={14} className="shrink-0 text-cocoa/40" /> : null}

              {isLast || item.href === undefined ? (
                <span aria-current={isLast ? 'page' : undefined} className="font-medium text-cocoa">
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="rounded-xs text-link underline decoration-1 underline-offset-[0.2em] hover:text-cocoa hover:decoration-2"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

/** Breadcrumbs + page title in the standard page rhythm. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs === undefined ? null : <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-title text-cocoa">{title}</h1>
          {description === undefined ? null : (
            <p className="text-lead max-w-[65ch] text-charcoal/90">{description}</p>
          )}
        </div>

        {actions === undefined ? null : <div className="flex shrink-0 gap-3">{actions}</div>}
      </div>
    </header>
  );
}
