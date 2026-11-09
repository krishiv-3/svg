import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSession } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const NAV = [
  { label: 'Dashboard', href: '/admin', ready: true },
  { label: 'Campaigns', href: '/admin/campaigns', ready: true },
  { label: 'Activities', href: '/admin/content/activities', ready: true },
  { label: 'Events', href: '/admin/content/events', ready: true },
  { label: 'News & Articles', href: '/admin/content/news', ready: true },
  { label: 'Enquiries', href: '/admin/enquiries', ready: true },
  { label: 'Pages', href: '/admin/pages', ready: false },
  { label: 'Gallery', href: '/admin/gallery', ready: false },
  { label: 'Testimonials', href: '/admin/testimonials', ready: false },
  { label: 'Impact Statistics', href: '/admin/impact', ready: false },
  { label: 'Donations', href: '/admin/donations', ready: false },
  { label: 'Users', href: '/admin/users', ready: false },
  { label: 'Settings', href: '/admin/settings', ready: false },
] as const;

/**
 * Admin shell.
 *
 * The session is verified **on the server** for every request under /admin; an
 * unauthenticated visitor is redirected before any data is fetched. Navigation
 * entries for modules that are not built yet are shown as disabled rather than
 * linking to a 404 — the interface does not promise what does not exist.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (session === null) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="border-b border-sand bg-white/70 px-4 py-4 lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div>
              <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
                Gaushala
              </p>
              <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Admin</p>
            </div>
            <p className="text-[length:var(--text-caption)] text-muted lg:mt-1">{session.name}</p>
          </div>

          <nav aria-label="Admin" className="mt-5">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {NAV.map((item) =>
                item.ready ? (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-[length:var(--text-label)] font-medium text-cocoa hover:bg-sand/50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.href}>
                    <span className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[length:var(--text-label)] text-muted/70">
                      {item.label}
                      <span className="rounded-full bg-sand/60 px-2 py-0.5 text-[0.65rem] tracking-wide uppercase">
                        Soon
                      </span>
                    </span>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
