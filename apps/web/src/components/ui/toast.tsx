'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { AlertTriangleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from '../icons';

/**
 * Toast notifications.
 *
 * A toast is for transient feedback about an action the user just took ("Draft
 * saved"). It is not a replacement for an inline alert: anything the user must
 * read, act on, or refer back to belongs in the page, not in a disappearing
 * overlay.
 *
 * The region is a polite live region; each toast can also be assertive when it
 * reports a failure. Toasts never steal focus, and dismissal is always
 * available by keyboard.
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<
  ToastTone,
  { container: string; icon: string; Icon: typeof InfoIcon; role: 'alert' | 'status' }
> = {
  info: { container: 'border-sand', icon: 'text-cocoa', Icon: InfoIcon, role: 'status' },
  success: {
    container: 'border-success/35',
    icon: 'text-success',
    Icon: CheckCircleIcon,
    role: 'status',
  },
  warning: {
    container: 'border-warning/40',
    icon: 'text-warning',
    Icon: AlertTriangleIcon,
    role: 'alert',
  },
  danger: {
    container: 'border-danger/40',
    icon: 'text-danger',
    Icon: AlertTriangleIcon,
    role: 'alert',
  },
};

export interface ToastProps {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Called when the user dismisses the toast. */
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ tone = 'info', title, description, onDismiss, className }: ToastProps) {
  const { container, icon, Icon, role } = TONES[tone];

  return (
    <div
      role={role}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-overlay',
        container,
        className,
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', icon)} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[length:var(--text-label)] font-semibold text-cocoa">{title}</p>
        {description === undefined ? null : (
          <p className="text-[length:var(--text-caption)] text-muted">{description}</p>
        )}
      </div>

      {onDismiss === undefined ? null : (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss: ${title}`}
          className="-mt-1 -mr-1 rounded-md p-1 text-muted hover:bg-sand/60 hover:text-cocoa"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

export interface ToastRegionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed container for toasts. Bottom-right on desktop, bottom-centre on mobile;
 * above the sticky donate bar and below modal dialogs.
 */
export function ToastRegion({ children, className }: ToastRegionProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col items-center gap-2',
        'sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end',
        className,
      )}
    >
      {children}
    </div>
  );
}
