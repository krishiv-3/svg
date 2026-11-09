import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ExternalLinkIcon } from '../icons';

/**
 * Text links.
 *
 * Links are underlined by default — colour alone is not a reliable affordance,
 * and WCAG 1.4.1 (use of colour) requires a second distinguishing cue.
 * `terracotta-ink` (not brand terracotta) is used because it reaches 5.9:1 on
 * warm ivory.
 */

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Adds an external-link icon and the correct `rel`/`target`. */
  external?: boolean;
  iconRight?: ReactNode;
}

export function TextLink({
  external = false,
  iconRight,
  className,
  children,
  href,
  ...rest
}: TextLinkProps) {
  const rel = external ? cn('noopener noreferrer', rest.rel) : rest.rel;
  const target = external ? '_blank' : rest.target;

  return (
    <a
      {...rest}
      href={href}
      {...(rel === undefined ? {} : { rel })}
      {...(target === undefined ? {} : { target })}
      className={cn(
        'text-link underline decoration-1 underline-offset-[0.2em]',
        'hover:text-cocoa hover:decoration-2',
        'rounded-xs transition-colors duration-150 ease-standard',
        className,
      )}
    >
      {children}
      {external ? (
        <>
          <span className="visually-hidden"> (opens in a new tab)</span>
          <ExternalLinkIcon size={14} className="ml-1 inline-block align-[-0.1em]" />
        </>
      ) : null}
      {iconRight}
    </a>
  );
}

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Marks the current page: colour plus weight, never colour alone. */
  isActive?: boolean;
}

/** Primary navigation item used in the header and footer. */
export function NavLink({ isActive = false, className, children, ...rest }: NavLinkProps) {
  return (
    <a
      {...rest}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // The underline is the affordance: it grows from the centre on hover and
        // stays visible for the current page — never colour alone.
        'relative inline-flex items-center rounded-md px-2 py-1.5 text-[length:var(--text-label)]',
        'transition-colors duration-150 ease-standard',
        'after:bg-terracotta after:absolute after:inset-x-2 after:bottom-1 after:h-[2px]',
        'after:origin-center after:scale-x-0 after:rounded-full after:transition-transform',
        'after:duration-200 after:ease-standard hover:after:scale-x-100',
        'aria-[current=page]:after:scale-x-100',
        isActive ? 'font-semibold text-cocoa' : 'font-medium text-cocoa/85 hover:text-cocoa',
        className,
      )}
    >
      {children}
    </a>
  );
}
