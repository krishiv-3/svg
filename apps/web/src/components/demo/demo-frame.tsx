import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { AlertTriangleIcon } from '@/components/icons';
import { Badge } from '@/components/ui';

/**
 * Demo-content markers.
 *
 * Every block of demonstration content is wrapped in `DemoFrame`, which adds a
 * visible chip, a machine-readable `data-demo="true"` attribute and an
 * explanatory line. The marker travels with the content, so a screenshot or a
 * review link can never show fictional figures without saying so.
 */

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="accent" size="sm" className={cn('tracking-[0.08em]', className)}>
      DEMO
    </Badge>
  );
}

export interface DemoFrameProps {
  children: ReactNode;
  /** Shown next to the chip, e.g. "Campaign card with illustrative data". */
  label?: string;
  /** Extra explanation under the block. */
  note?: string;
  className?: string;
}

export function DemoFrame({ children, label, note, className }: DemoFrameProps) {
  return (
    <div
      data-demo="true"
      className={cn(
        'rounded-2xl border border-dashed border-brass/70 bg-brass/[0.04] p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DemoBadge />
        <span className="text-[length:var(--text-caption)] font-medium text-cocoa">
          {label ?? 'Demonstration content'}
        </span>
        <span className="text-[length:var(--text-caption)] text-muted">
          Illustrative only — not a verified claim.
        </span>
      </div>

      {children}

      {note === undefined ? null : (
        <p className="mt-4 text-[length:var(--text-caption)] text-muted">{note}</p>
      )}
    </div>
  );
}

export interface DemoBannerProps {
  className?: string;
}

/** Page-level notice placed at the top of every demo reference page. */
export function DemoBanner({ className }: DemoBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-warning/35 bg-warning/5 p-4',
        className,
      )}
    >
      <AlertTriangleIcon size={20} className="mt-0.5 shrink-0 text-warning" />

      <div className="flex flex-col gap-1">
        <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
          Everything below is demonstration content
        </p>
        <p className="text-[length:var(--text-body-sm)] text-charcoal/90">
          Names, figures, campaigns, events and quotations on this page are fictional and exist only
          so the layouts can be reviewed. No organisation claim is being made, no donation can be
          made, and nothing here is served by the API or stored in the database.
        </p>
      </div>
    </div>
  );
}
