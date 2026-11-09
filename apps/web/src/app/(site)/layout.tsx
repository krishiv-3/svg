import type { ReactNode } from 'react';

import {
  FOOTER_NAV,
  FooterContact,
  PRIMARY_NAV,
  SiteFooter,
  SiteHeader,
  StickyDonateCta,
} from '@/components/site';
import { SkipLink } from '@/components/ui';

/**
 * Public site shell.
 *
 * Owns the chrome shared by every public page: skip link, floating header, the
 * `main` landmark, the mobile donation bar and the footer. The route group does
 * not affect URLs, so `/` is still the homepage.
 *
 * The footer deliberately receives no social links and no contact details: the
 * organisation has not supplied verified values, and inventing them would be a
 * factual claim. `FooterContact` states that they are pending instead.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader navItems={PRIMARY_NAV} />

      <main id="main-content">{children}</main>

      <StickyDonateCta />

      <SiteFooter
        columns={FOOTER_NAV}
        tagline="Compassion, nourishment and shelter for cows. This is a preview build — content, photography and organisation details are illustrative until verified."
        contact={<FooterContact lines={[]} />}
      />
    </>
  );
}
