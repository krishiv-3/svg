import { cn } from '@/lib/cn';

/**
 * Progress bar.
 *
 * Exposes real progress semantics (`role="progressbar"` with value bounds) so
 * assistive technology announces "62 percent" instead of nothing. The visual bar
 * is decorative and hidden from the accessibility tree.
 *
 * Used by campaign cards; the value must come from verified donation data in
 * production, never from a client-side estimate.
 */

export type ProgressTone = 'brand' | 'success' | 'muted';

const TONES: Record<ProgressTone, string> = {
  brand: 'bg-terracotta',
  success: 'bg-success',
  muted: 'bg-cocoa/50',
};

export interface ProgressBarProps {
  /** Current value, in the same unit as `max`. */
  value: number;
  max?: number;
  /** Accessible name, e.g. "Winter fodder fund progress". */
  label: string;
  /** Renders the percentage next to the bar. */
  showValue?: boolean;
  tone?: ProgressTone;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  tone = 'brand',
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuetext={`${String(percent)}%`}
        className="h-2 w-full overflow-hidden rounded-full bg-sand"
      >
        <div
          aria-hidden="true"
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-standard',
            TONES[tone],
          )}
          style={{ width: `${String(percent)}%` }}
        />
      </div>

      {showValue ? (
        <p className="text-[length:var(--text-caption)] text-muted tabular-nums">{percent}%</p>
      ) : null}
    </div>
  );
}
