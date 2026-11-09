import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ImageIcon, LoaderIcon } from '../icons';

/**
 * Loading and empty states.
 *
 * Loading indicators announce themselves politely (`role="status"`); empty
 * states explain what is missing and, where useful, offer the next action
 * instead of leaving a blank panel.
 */

export interface SpinnerProps {
  size?: number;
  /** Accessible label announced while loading. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 20, label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center', className)}>
      <LoaderIcon size={size} className="animate-spin text-cocoa" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export interface SkeletonProps {
  className?: string;
}

/** Decorative placeholder for content that is still loading. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-sand/70', className)} />
  );
}

export interface LoadingStateProps {
  message?: string;
  /** Extra context for assistive technology. */
  description?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading…', description, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      <LoaderIcon size={28} className="animate-spin text-terracotta" />
      <p className="text-body-sm font-medium text-cocoa">{message}</p>
      {description === undefined ? null : <p className="text-caption text-muted">{description}</p>}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong',
        'bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand/70 text-cocoa">
        {icon ?? <ImageIcon size={22} />}
      </span>

      <p className="text-subheading text-cocoa">{title}</p>

      {description === undefined ? null : (
        <p className="max-w-[46ch] text-body-sm text-muted">{description}</p>
      )}

      {action === undefined ? null : <div className="mt-1">{action}</div>}
    </div>
  );
}
