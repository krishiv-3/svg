'use client';

import { LogOutIcon, SettingsIcon, UsersIcon } from '../icons';
import { ActionMenu } from './action-menu';

/**
 * Signed-in user area for the admin header.
 *
 * Shows identity before actions: the name and role are always visible, and the
 * menu holds profile, settings and sign-out. The avatar is initials on a sand
 * disc — no invented profile photograph.
 */

export interface UserMenuProps {
  name: string;
  role: string;
  email?: string;
}

export function UserMenu({ name, role, email }: UserMenuProps) {
  const initials = name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ActionMenu
      label={`Account menu for ${name}`}
      align="right"
      trigger={
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="bg-sand text-cocoa flex h-8 w-8 items-center justify-center rounded-full text-[length:var(--text-caption)] font-semibold"
          >
            {initials}
          </span>
          <span className="hidden flex-col text-left sm:flex">
            <span className="text-[length:var(--text-label)] leading-tight font-medium text-cocoa">
              {name}
            </span>
            <span className="text-[length:var(--text-caption)] leading-tight text-muted">
              {role}
            </span>
          </span>
        </span>
      }
      items={[
        ...(email === undefined ? [] : [{ label: email, disabled: true }]),
        { label: 'Your profile', href: '/admin/profile', icon: <UsersIcon size={16} /> },
        {
          label: 'Account settings',
          href: '/admin/profile/security',
          icon: <SettingsIcon size={16} />,
        },
        {
          label: 'Sign out',
          href: '/admin/login',
          icon: <LogOutIcon size={16} />,
          tone: 'danger' as const,
        },
      ]}
    />
  );
}
