import type { ReactNode } from 'react';

import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui';

/**
 * Page hero.
 *
 * The shared title area for secondary pages: breadcrumb, eyebrow, `h1`, lead
 * paragraph and optional actions. It owns the only `h1` on the page, so section
 * components below always start at `h2`.
 *
 * The warm ambient light matches the homepage hero without copying its layout —
 * secondary pages should feel quieter than the landing page.
 */
export interface PageHeroProps {
  eyebrow?: string;
  heading: string;
  description: string;
  breadcrumbs: readonly BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHero({ eyebrow, heading, description, breadcrumbs, actions }: PageHeroProps) {
  return (
    <header className="relative isolate overflow-hidden bg-ivory px-4 pt-10 pb-12 sm:px-6 sm:pt-12 sm:pb-14">
      <div
        aria-hidden="true"
        className="bg-[image:var(--gradient-hero-bloom)] pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] opacity-80"
      />

      <div className="mx-auto max-w-[1180px]">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-5 flex max-w-[62rem] flex-col items-start gap-4">
          {eyebrow === undefined ? null : (
            <p className="glass inline-flex items-center rounded-full px-3.5 py-1.5 text-[length:var(--text-overline)] font-semibold tracking-[0.14em] text-terracotta-ink uppercase">
              {eyebrow}
            </p>
          )}

          <h1 className="text-display max-w-[22ch] text-cocoa">{heading}</h1>

          <p className="text-lead max-w-[58ch] text-charcoal/90">{description}</p>

          {actions === undefined ? null : (
            <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
