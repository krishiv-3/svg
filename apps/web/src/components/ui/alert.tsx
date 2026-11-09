import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from '../icons';

/**
 * Alerts and notifications.
 *
 * The tone changes the icon, the accent border and the live-region behaviour —
 * never the text colour alone:
 *  - `danger` and `warning` use `role="alert"` (assertive);
 *  - `success` and `info` use `role="status"` (polite).
 *
 * Alerts are for content that belongs in the flow. Transient feedback belongs
 * in the toast layer (added with the admin shell).
 */

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<
  AlertTone,
  { container: string; icon: string; Icon: typeof InfoIcon; role: 'alert' | 'status' }
> = {
  info: {
    container: 'border-sand border-l-cocoa bg-white',
    icon: 'text-cocoa',
    Icon: InfoIcon,
    role: 'status',
  },
  success: {
    container: 'border-success/25 border-l-success bg-success/5',
    icon: 'text-success',
    Icon: CheckCircleIcon,
    role: 'status',
  },
  warning: {
    container: 'border-warning/30 border-l-warning bg-warning/5',
    icon: 'text-warning',
    Icon: AlertTriangleIcon,
    role: 'alert',
  },
  danger: {
    container: 'border-danger/30 border-l-danger bg-danger/5',
    icon: 'text-danger',
    Icon: XCircleIcon,
    role: 'alert',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children: ReactNode;
  /** Optional action rendered below the text. */
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { container, icon, Icon, role } = TONES[tone];

  return (
    <div
      role={role}
      className={cn('flex gap-3 rounded-lg border border-l-4 p-4', container, className)}
    >
      <Icon size={20} className={cn('mt-0.5 shrink-0', icon)} />

      <div className="flex flex-col gap-1">
        {title === undefined ? null : (
          <p className="text-label font-semibold text-cocoa">{title}</p>
        )}
        <div className="text-body-sm text-charcoal">{children}</div>
        {action === undefined ? null : <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
