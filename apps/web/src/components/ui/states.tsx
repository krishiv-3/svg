import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { AlertTriangleIcon, CheckCircleIcon } from '../icons';

/**
 * Full-panel success and error states.
 *
 * `ErrorState` is for a failed page or request: it always offers a way forward
 * and, when the backend supplies one, a reference the person can quote to
 * support. It never shows a stack trace.
 *
 * `SuccessState` confirms a completed action and offers the logical next step.
 */

export interface ErrorStateProps {
  title: string;
  description: string;
  /** Short, non-sensitive reference the user can quote (e.g. request id). */
  reference?: string;
  /** Retry / go back action. */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, reference, action, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-danger">
        <AlertTriangleIcon size={22} />
      </span>

      <p className="text-subheading text-cocoa">{title}</p>
      <p className="max-w-[46ch] text-body-sm text-charcoal/90">{description}</p>

      {reference === undefined ? null : (
        <p className="text-[length:var(--text-caption)] text-muted">
          Reference: <code className="font-mono">{reference}</code>
        </p>
      )}

      {action === undefined ? null : <div className="mt-1">{action}</div>}
    </div>
  );
}

export interface SuccessStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SuccessState({ title, description, action, className }: SuccessStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-success">
        <CheckCircleIcon size={22} />
      </span>

      <p className="text-subheading text-cocoa">{title}</p>
      {description === undefined ? null : (
        <p className="max-w-[46ch] text-body-sm text-charcoal/90">{description}</p>
      )}

      {action === undefined ? null : <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Inline success message used inside forms after a valid submission. */
export function FormSuccess({
  title = 'Saved',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/5 p-3.5',
        className,
      )}
    >
      <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-success" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[length:var(--text-label)] font-semibold text-cocoa">{title}</p>
        {description === undefined ? null : (
          <p className="text-[length:var(--text-caption)] text-charcoal/90">{description}</p>
        )}
      </div>
    </div>
  );
}
