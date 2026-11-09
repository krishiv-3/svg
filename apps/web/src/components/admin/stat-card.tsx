import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Dashboard metric card.
 *
 * Financial figures must only ever be rendered from verified data. In this
 * design-system phase the value is a plain string and callers pass "—" until
 * Phase 8 wires real counts.
 */

export type TrendDirection = 'up' | 'down' | 'flat';

export interface StatCardProps {
  label: string;
  value: string;
  /** Context for the number: period, scope, or "verified only". */
  hint?: string;
  icon?: ReactNode;
  trend?: { direction: TrendDirection; label: string };
  className?: string;
}

const TREND_STYLE: Record<TrendDirection, string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-muted',
};

const TREND_GLYPH: Record<TrendDirection, string> = {
  up: '▲',
  down: '▼',
  flat: '■',
};

export function StatCard({ label, value, hint, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('border-sand rounded-xl border bg-white p-5 shadow-soft', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[length:var(--text-label)] font-medium text-muted">{label}</p>
        {icon === undefined ? null : (
          <span className="text-cocoa/70" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <p className="text-[length:var(--text-heading)] mt-2 leading-none font-semibold text-cocoa tabular-nums">
        {value}
      </p>

      {hint === undefined ? null : (
        <p className="text-[length:var(--text-caption)] mt-1.5 text-muted">{hint}</p>
      )}

      {trend === undefined ? null : (
        <p
          className={cn(
            'text-[length:var(--text-caption)] mt-2 flex items-center gap-1 font-medium',
            TREND_STYLE[trend.direction],
          )}
        >
          <span aria-hidden="true">{TREND_GLYPH[trend.direction]}</span>
          {trend.label}
        </p>
      )}
    </div>
  );
}
