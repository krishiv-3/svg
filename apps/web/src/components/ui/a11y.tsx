import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Accessibility primitives.
 */

export interface SkipLinkProps {
  /** Id of the main content region on the page. */
  targetId?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * "Skip to main content" link.
 *
 * The first focusable element on a page. Visually hidden until focused, then
 * pinned to the top-left so a keyboard user can bypass the header and nav.
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={cn('skip-link', className)}>
      {children}
    </a>
  );
}

export interface VisuallyHiddenProps {
  children: ReactNode;
  /** Set when the content should become visible on focus (e.g. a skip link). */
  focusable?: boolean;
  className?: string;
}

/** Content available to assistive technology but not to sighted users. */
export function VisuallyHidden({ children, focusable = false, className }: VisuallyHiddenProps) {
  return (
    <span className={cn('visually-hidden', focusable ? 'focus:not-sr-only' : undefined, className)}>
      {children}
    </span>
  );
}
