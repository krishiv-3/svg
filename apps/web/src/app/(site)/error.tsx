'use client';

import { Button, Container, ErrorState } from '@/components/ui';

/**
 * Content error boundary.
 *
 * Reached when a page cannot load its content — typically the API is down or
 * returned an unexpected payload. It deliberately offers no cached or demo
 * content: a page that cannot show real data says so.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-20">
      <ErrorState
        title="We could not load this page"
        description="The content service did not respond as expected. Nothing has been changed — please try again in a moment."
        {...(error.digest === undefined ? {} : { reference: error.digest })}
        action={
          <Button onClick={reset} size="md">
            Try again
          </Button>
        }
      />
    </Container>
  );
}
