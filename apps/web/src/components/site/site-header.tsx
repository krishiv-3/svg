'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { HeartIcon, MenuIcon } from '@/components/icons';
import { Button, ButtonLink, Dialog, NavLink } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { NavItem } from './nav';

/**
 * Floating glass header.
 *
 * A pill-shaped glass surface that hovers over the page rather than a full-width
 * bar: translucent warm ivory, a fine light border, one ambient shadow and a
 * backdrop blur. It compacts slightly once the page scrolls, so the brand stays
 * present without covering content.
 *
 * The mark is a provisional geometric device (a warm arch) drawn in the brand
 * gradient — the official logo is supplied by the organisation in Phase 10.
 *
 * Accessibility: the mobile menu uses the native `<dialog>` (focus trap, Escape,
 * focus return), the trigger exposes `aria-expanded`/`aria-haspopup`, and the
 * skip link lives on each page.
 */

export interface SiteHeaderProps {
  siteName?: string;
  navItems: readonly NavItem[];
  activeHref?: string;
  donateHref?: string;
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 22a8 8 0 0 1 16 0" />
      <path d="M12 22v-4a4 4 0 0 1 8 0v4" opacity="0.55" />
    </svg>
  );
}

export function SiteHeader({
  siteName = 'Shri Vanshidhar Gaushala',
  navItems,
  activeHref,
  donateHref = '/donate',
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The layout renders the header once for every public page, so the active
  // item is derived from the current path unless a page overrides it.
  const pathname = usePathname();
  const active = activeHref ?? pathname;

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className="z-sticky sticky top-0">
      <div className="mx-auto w-full max-w-[1180px] px-3 pt-3 pb-2 sm:px-5">
        <div
          className={cn(
            'glass flex items-center justify-between gap-2 rounded-full pr-2 pl-2.5',
            'transition-[padding,box-shadow] duration-300 ease-standard sm:pl-3.5',
            scrolled ? 'py-1.5 shadow-glass' : 'py-2',
          )}
        >
          <a href="/" className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-cta)] text-ivory shadow-soft">
              <BrandMark />
            </span>
            <span className="min-w-0 truncate text-[length:var(--text-body-sm)] font-semibold tracking-tight text-cocoa">
              {siteName}
            </span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} isActive={active === item.href} className="px-3 py-2">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="hidden sm:block">
              <ButtonLink
                href={donateHref}
                size="md"
                iconLeft={<HeartIcon size={16} />}
                className="cta-gradient shadow-soft"
              >
                Donate
              </ButtonLink>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full px-0 lg:hidden"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen(true);
              }}
            >
              <MenuIcon size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation as a native modal dialog (focus trap + Escape). */}
      <Dialog
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
        title="Menu"
        size="sm"
        footer={
          <ButtonLink
            href={donateHref}
            fullWidth
            size="md"
            iconLeft={<HeartIcon size={16} />}
            className="cta-gradient"
            onClick={() => {
              setMenuOpen(false);
            }}
          >
            Donate
          </ButtonLink>
        }
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  isActive={active === item.href}
                  className="block px-2 py-3 text-[length:var(--text-body)]"
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Dialog>
    </header>
  );
}
