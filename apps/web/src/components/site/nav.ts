/**
 * Navigation defaults.
 *
 * These hrefs are the approved public routes from the blueprint (§3). Every
 * entry below resolves to an implemented page as of Phase 5; a link is added
 * here only once its destination exists.
 *
 * Routes that are planned but not yet built — `/gaushala`, `/impact`,
 * `/transparency`, `/volunteer` and the legal pages — are deliberately absent
 * from the footer rather than pointing at the 404 page. They return when the
 * pages do (Phases 5b/10).
 *
 * The final menus are CMS-managed (`menu_items` table) — these constants are the
 * development defaults only.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

/**
 * Footer columns.
 *
 * Only implemented routes appear here. The previous Legal column pointed at
 * `/privacy-policy`, `/terms` and `/refund-policy`, none of which exist yet, so
 * it has been removed rather than left to 404 from every page on the site.
 */
export const FOOTER_NAV: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: 'Explore',
    items: [
      { label: 'About us', href: '/about' },
      { label: 'Our work', href: '/our-work' },
      { label: 'Campaigns', href: '/campaigns' },
    ],
  },
  {
    title: 'Our Work',
    items: [
      { label: 'Activities', href: '/our-work' },
      { label: 'Events', href: '/events' },
      { label: 'News', href: '/news' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Donate', href: '/donate' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
];
