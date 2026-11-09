import type { ReactNode } from 'react';

import { Container } from '@/components/ui';
import { cn } from '@/lib/cn';

import { ADMIN_NAV, AdminSidebar, type AdminNavGroup } from './admin-sidebar';

/**
 * Admin shell.
 *
 * Two-column layout on large screens; on small screens the sidebar becomes a
 * horizontally scrollable section strip above the content so the page stays
 * usable on a phone without a JavaScript drawer (the full drawer arrives with
 * the real admin in Phase 8).
 */

export interface AdminShellProps {
  children: ReactNode;
  groups?: readonly AdminNavGroup[];
  activeHref?: string;
  siteName?: string;
}

export function AdminShell({
  children,
  groups = ADMIN_NAV,
  activeHref,
  siteName,
}: AdminShellProps) {
  return (
    <div className="bg-sand/25 min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <AdminSidebar
          groups={groups}
          {...(activeHref === undefined ? {} : { activeHref })}
          {...(siteName === undefined ? {} : { siteName })}
        />
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="border-sand bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="text-[length:var(--text-body-sm)] font-semibold text-cocoa">
              {siteName ?? 'Shri Vanshidhar Gaushala'}
            </span>
            <span className="text-[length:var(--text-caption)] text-muted">Admin</span>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-sand px-3 py-2">
            {groups.flatMap((group) =>
              group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={activeHref === item.href ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-[length:var(--text-caption)] font-medium whitespace-nowrap',
                    activeHref === item.href
                      ? 'bg-sand text-cocoa'
                      : 'text-charcoal/80 hover:bg-sand/50',
                  )}
                >
                  {item.label}
                </a>
              )),
            )}
          </div>
        </div>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Search field or filter controls. */
  search?: ReactNode;
  className?: string;
}

export function AdminHeader({ title, description, actions, search, className }: AdminHeaderProps) {
  return (
    <div className={cn('border-b border-sand bg-white', className)}>
      <Container size="wide" className="flex flex-col gap-3 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[length:var(--text-heading)] leading-tight font-semibold text-cocoa">
              {title}
            </h1>
            {description === undefined ? null : (
              <p className="text-[length:var(--text-body-sm)] text-muted">{description}</p>
            )}
          </div>

          {actions === undefined ? null : (
            <div className="flex shrink-0 items-center gap-2">
              {search}
              {actions}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

/** Standard padded content area for admin pages. */
export function AdminContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Container size="wide" className={cn('flex flex-col gap-6 py-6', className)}>
      {children}
    </Container>
  );
}
