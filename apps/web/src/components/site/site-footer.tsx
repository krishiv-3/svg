import type { ReactNode } from 'react';

import {
  HeartIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  XIcon,
  YoutubeIcon,
} from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui';
import { cn } from '@/lib/cn';

import { HeritageSkyline } from './heritage-skyline';
import type { NavItem } from './nav';

/**
 * Site footer.
 *
 * A dark cocoa surround holding a light ivory panel — the panel is the "card"
 * and the surround gives the page a deliberate end. Inside: brand, a newsletter
 * foundation, five link columns, an optional verified contact block, an original
 * heritage skyline illustration, and a quiet legal bar.
 *
 * Content is passed in by the page (CMS `contact.details` and `menu_items` in
 * Phase 6). The footer never hardcodes an address, and the newsletter controls
 * are disabled with an explanation until email delivery is configured.
 */

export interface FooterColumn {
  title: string;
  items: readonly NavItem[];
}

export type SocialNetwork = 'instagram' | 'youtube' | 'x';

export interface SocialLink {
  label: string;
  href: string;
  network: SocialNetwork;
}

export interface SiteFooterProps {
  siteName?: string;
  columns: readonly FooterColumn[];
  /** Contact block; rendered from verified CMS settings once available. */
  contact?: ReactNode;
  /** Short line under the wordmark. Supplied by the organisation. */
  tagline?: string;
  donateHref?: string;
  legalNote?: ReactNode;
  socialLinks?: readonly SocialLink[];
  className?: string;
}

const SOCIAL_ICONS: Record<SocialNetwork, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  x: XIcon,
};

export function SiteFooter({
  siteName = 'Shri Vanshidhar Gaushala',
  columns,
  contact,
  tagline,
  donateHref = '/donate',
  legalNote,
  socialLinks = [],
  className,
}: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('bg-cocoa px-3 pt-12 pb-6 sm:px-5 sm:pt-16', className)}>
      <div className="mx-auto max-w-[1180px]">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-footer-panel)] shadow-glass">
          <div className="relative px-6 pt-9 pb-8 sm:px-9 sm:pt-11 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
              {/* Brand */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--gradient-cta)] text-ivory shadow-soft">
                    <svg
                      viewBox="0 0 32 32"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M8 22a8 8 0 0 1 16 0" />
                      <path d="M12 22v-4a4 4 0 0 1 8 0v4" opacity="0.55" />
                    </svg>
                  </span>
                  <p className="text-[length:var(--text-body)] font-semibold tracking-tight text-cocoa">
                    {siteName}
                  </p>
                </div>

                {tagline === undefined ? null : (
                  <p className="max-w-[42ch] text-[length:var(--text-body-sm)] text-charcoal/80">
                    {tagline}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <ButtonLink
                    href={donateHref}
                    size="md"
                    iconLeft={<HeartIcon size={16} />}
                    className="cta-gradient shadow-soft"
                  >
                    Donate
                  </ButtonLink>

                  {socialLinks.length === 0 ? null : (
                    <ul className="flex items-center gap-1.5">
                      {socialLinks.map((social) => {
                        const Icon = SOCIAL_ICONS[social.network];

                        return (
                          <li key={social.href}>
                            <a
                              href={social.href}
                              aria-label={social.label}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/15 text-cocoa transition-colors duration-150 ease-standard hover:border-cocoa/30 hover:bg-white/70"
                            >
                              <Icon size={17} />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Newsletter foundation — visibly not yet active. */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[length:var(--text-label)] font-semibold text-cocoa">
                  Newsletter
                </p>
                <p className="text-[length:var(--text-caption)] text-muted">
                  Occasional updates on the work, campaigns and events.
                </p>

                <div className="mt-1 flex gap-2">
                  <label htmlFor="footer-newsletter-email" className="visually-hidden">
                    Email address for the newsletter
                  </label>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    name="newsletter-email"
                    placeholder="Enter email address"
                    disabled
                    aria-describedby="footer-newsletter-note"
                    className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-white/70 px-3 text-[length:var(--text-body-sm)] text-charcoal placeholder:text-muted/75 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <Button size="sm" disabled>
                    Submit
                  </Button>
                </div>

                <p
                  id="footer-newsletter-note"
                  className="text-[length:var(--text-caption)] text-muted"
                >
                  Email signup is shown for layout only and will be enabled once mail delivery is
                  configured.
                </p>
              </div>
            </div>

            {/* Link columns */}
            <nav
              aria-label="Footer"
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-cocoa/10 pt-8 sm:grid-cols-3"
            >
              {columns.map((column) => (
                <div key={column.title}>
                  <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
                    {column.title}
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {column.items.map((item) => (
                      <li key={`${column.title}-${item.href}`}>
                        <a
                          href={item.href}
                          className="rounded-xs text-[length:var(--text-body-sm)] text-charcoal/85 underline-offset-[0.2em] transition-colors duration-150 ease-standard hover:text-cocoa hover:underline"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {contact === undefined ? null : (
              <div className="mt-8 border-t border-cocoa/10 pt-6">{contact}</div>
            )}
          </div>

          {/* Decorative heritage skyline. */}
          <HeritageSkyline className="relative -mb-1 opacity-95" />

          <div className="relative flex flex-col gap-3 border-t border-cocoa/10 px-6 py-5 text-[length:var(--text-caption)] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-12">
            <p>
              © {year} {siteName}. All rights reserved.
            </p>

            {legalNote === undefined ? null : <div>{legalNote}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact block                                                              */
/* -------------------------------------------------------------------------- */

export interface ContactLine {
  label: string;
  value: string;
  href?: string;
}

/**
 * Renders verified contact details. When no details exist yet, it says so
 * explicitly rather than inventing an address or phone number.
 */
export function FooterContact({ lines }: { lines: readonly ContactLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-[length:var(--text-body-sm)] text-muted">
        Contact details will be published once the organisation confirms them.
      </p>
    );
  }

  const icons = {
    address: MapPinIcon,
    phone: PhoneIcon,
    email: MailIcon,
  } as const;

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {lines.map((line) => {
        const Icon = icons[line.label.toLowerCase() as keyof typeof icons] ?? MapPinIcon;

        return (
          <li key={line.label} className="flex items-start gap-2.5">
            <Icon size={18} className="mt-0.5 shrink-0 text-terracotta-ink" />
            <div className="flex flex-col">
              <span className="text-[length:var(--text-overline)] tracking-[0.14em] text-muted uppercase">
                {line.label}
              </span>
              {line.href === undefined ? (
                <span className="text-[length:var(--text-body-sm)] text-charcoal/90">
                  {line.value}
                </span>
              ) : (
                <a
                  href={line.href}
                  className="rounded-xs text-[length:var(--text-body-sm)] text-cocoa underline-offset-[0.2em] hover:underline"
                >
                  {line.value}
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
