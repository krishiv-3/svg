import type { ReactNode } from 'react';

import {
  CameraIcon,
  CalendarIcon,
  DashboardIcon,
  FileTextIcon,
  InboxIcon,
  MegaphoneIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
} from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * Admin design language.
 *
 * Shares colour, type and shape tokens with the public site but optimises for
 * clarity and throughput rather than atmosphere: denser spacing, a quiet white
 * sidebar, table-first layouts and explicit status colours.
 *
 * Navigation is a plain list of links — no client-side router state in this
 * phase. The routes are created in Phase 8; until then they resolve to 404.
 */

export interface AdminNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Optional count badge (e.g. pending enquiries). */
  badge?: string;
}

export interface AdminNavGroup {
  title: string;
  items: readonly AdminNavItem[];
}

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    title: 'Content',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <DashboardIcon size={18} /> },
      { label: 'Pages', href: '/admin/content/pages', icon: <FileTextIcon size={18} /> },
      { label: 'News', href: '/admin/content/news', icon: <FileTextIcon size={18} /> },
      { label: 'Events', href: '/admin/content/events', icon: <CalendarIcon size={18} /> },
      { label: 'Campaigns', href: '/admin/content/campaigns', icon: <MegaphoneIcon size={18} /> },
      { label: 'Media', href: '/admin/media', icon: <CameraIcon size={18} /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Enquiries', href: '/admin/enquiries', icon: <InboxIcon size={18} /> },
      { label: 'Donations', href: '/admin/donations', icon: <ReceiptIcon size={18} /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/admin/users', icon: <UsersIcon size={18} /> },
      { label: 'Settings', href: '/admin/settings/general', icon: <SettingsIcon size={18} /> },
    ],
  },
];

export interface AdminSidebarProps {
  groups?: readonly AdminNavGroup[];
  activeHref?: string;
  siteName?: string;
}

export function AdminSidebar({
  groups = ADMIN_NAV,
  activeHref,
  siteName = 'Shri Vanshidhar Gaushala',
}: AdminSidebarProps) {
  return (
    <aside className="border-sand bg-white lg:border-r" aria-label="Admin navigation">
      <div className="flex h-16 items-center border-b border-sand px-5">
        <div className="flex flex-col">
          <span className="text-[length:var(--text-body-sm)] font-semibold tracking-tight text-cocoa">
            {siteName}
          </span>
          <span className="text-[length:var(--text-caption)] text-muted">Admin dashboard</span>
        </div>
      </div>

      <nav className="flex flex-col gap-6 p-4" aria-label="Sections">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[length:var(--text-overline)] px-2 font-semibold tracking-[0.14em] text-muted uppercase">
              {group.title}
            </p>

            <ul className="mt-2 flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = activeHref === item.href;

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2',
                        'text-[length:var(--text-body-sm)] transition-colors duration-150 ease-standard',
                        isActive
                          ? 'bg-sand/70 font-semibold text-cocoa'
                          : 'font-medium text-charcoal/85 hover:bg-sand/40 hover:text-cocoa',
                      )}
                    >
                      <span className={cn(isActive ? 'text-terracotta-ink' : 'text-muted')}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge === undefined ? null : (
                        <span className="rounded-full bg-terracotta/12 px-1.5 py-0.5 text-[length:var(--text-caption)] font-semibold text-terracotta-ink">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
