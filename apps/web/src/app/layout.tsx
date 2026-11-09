import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { SITE_NAME } from '@gaushala/shared';

import { serverEnv } from '@/lib/server-env';

import './globals.css';

/**
 * Typography.
 *
 * Inter is self-hosted (latin subset, 48 KB variable font, OFL licensed), so no
 * request goes to Google at build or run time. `next/font/local` fingerprints
 * the file, preloads it, generates a metric-matched fallback to minimise layout
 * shift during `font-display: swap`, and exposes it as `--font-inter`, which
 * `globals.css` composes into `--font-sans`.
 *
 * Devanagari: the stack already includes 'Noto Sans Devanagari' for the future
 * Hindi launch (ADR-013). A self-hosted Devanagari subset is added with that
 * launch rather than shipping unused bytes now.
 */
const inter = localFont({
  src: '../fonts/inter-latin-variable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  preload: true,
  fallback: [
    'ui-sans-serif',
    'system-ui',
    'Segoe UI',
    'Noto Sans Devanagari',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  metadataBase: new URL(serverEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  // PHASE 3: the public site is not built yet. This noindex is removed in the
  // phase that makes the public site ready — not before.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
