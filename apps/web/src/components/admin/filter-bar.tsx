import type { ReactNode } from 'react';

import { SearchIcon } from '@/components/icons';
import { Badge, type BadgeTone } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Admin filtering toolbar.
 *
 * A labelled search field plus slots for filters and actions. On small screens
 * the controls stack; on larger screens they sit on one line.
 */

export interface FilterBarProps {
  /** Id of the search input, used to bind the label. */
  searchId?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  defaultValue?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchId = 'admin-search',
  searchLabel = 'Search',
  searchPlaceholder = 'Search…',
  defaultValue,
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'border-sand flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-soft',
        'lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col">
          <label
            htmlFor={searchId}
            className="text-[length:var(--text-label)] mb-1.5 font-medium text-cocoa"
          >
            {searchLabel}
          </label>

          <div className="relative">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              id={searchId}
              type="search"
              name={searchId}
              placeholder={searchPlaceholder}
              {...(defaultValue === undefined ? {} : { defaultValue })}
              className="border-border-strong text-[length:var(--text-body-sm)] h-10 w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-charcoal placeholder:text-muted/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa sm:w-64"
            />
          </div>
        </div>

        {filters}
      </div>

      {actions === undefined ? null : <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status indicators                                                          */
/* -------------------------------------------------------------------------- */

export type ContentStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'ARCHIVED'
  | 'IN_REVIEW'
  | 'ACTIVE'
  | 'INVITED'
  | 'SUSPENDED'
  | 'NEW'
  | 'RESOLVED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED';

const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  DRAFT: { tone: 'neutral', label: 'Draft' },
  IN_REVIEW: { tone: 'warning', label: 'In review' },
  SCHEDULED: { tone: 'brand', label: 'Scheduled' },
  PUBLISHED: { tone: 'success', label: 'Published' },
  UNPUBLISHED: { tone: 'neutral', label: 'Unpublished' },
  ARCHIVED: { tone: 'neutral', label: 'Archived' },
  ACTIVE: { tone: 'success', label: 'Active' },
  INVITED: { tone: 'warning', label: 'Invited' },
  SUSPENDED: { tone: 'danger', label: 'Suspended' },
  NEW: { tone: 'brand', label: 'New' },
  RESOLVED: { tone: 'success', label: 'Resolved' },
  PENDING: { tone: 'warning', label: 'Pending' },
  SUCCEEDED: { tone: 'success', label: 'Verified' },
  FAILED: { tone: 'danger', label: 'Failed' },
  REFUNDED: { tone: 'neutral', label: 'Refunded' },
};

export interface StatusBadgeProps {
  status: string;
  /** Overrides the built-in label, e.g. "Verified" vs "Succeeded". */
  label?: string;
  className?: string;
}

/**
 * Status indicator. The label always carries the meaning; colour only
 * reinforces it, so the component remains usable without colour perception.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? { tone: 'neutral' as BadgeTone, label: status };

  return (
    <Badge tone={meta.tone} size="sm" className={className}>
      {label ?? meta.label}
    </Badge>
  );
}
