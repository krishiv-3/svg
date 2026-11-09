import { ButtonLink, Container } from '@/components/ui';

/**
 * Not found.
 *
 * Rendered inside the site layout, so a wrong campaign, event or article slug
 * still shows the header and footer rather than a bare page. It offers a way
 * forward instead of only an apology.
 */
export default function SiteNotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center gap-5 py-16">
      <p className="text-[length:var(--text-overline)] font-semibold tracking-[0.16em] text-terracotta-ink uppercase">
        404
      </p>

      <h1 className="text-display max-w-[18ch] text-cocoa">This page does not exist.</h1>

      <p className="text-lead max-w-[52ch] text-charcoal/90">
        The link may be out of date, or the page may not have been published yet. Nothing has been
        lost — try one of these instead.
      </p>

      <div className="flex flex-wrap gap-3 pt-1">
        <ButtonLink href="/" size="md" className="cta-gradient">
          Go to the homepage
        </ButtonLink>
        <ButtonLink href="/news" size="md" variant="secondary">
          Read the latest news
        </ButtonLink>
        <ButtonLink href="/contact" size="md" variant="outline">
          Contact us
        </ButtonLink>
      </div>
    </Container>
  );
}
