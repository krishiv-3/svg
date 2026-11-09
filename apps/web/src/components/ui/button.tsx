import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { LoaderIcon } from '../icons';

/**
 * Buttons.
 *
 * Variants are deliberate, not decorative:
 *  - `primary`   one per view/section — the main action (usually Donate)
 *  - `secondary` supporting actions on light surfaces
 *  - `outline`   quiet bordered action that still reads as a control
 *  - `ghost`     low-emphasis actions inside dense UI
 *  - `inverse`   supporting actions on cocoa or photographic surfaces
 *  - `danger`    irreversible actions (delete, void, refund)
 *
 * All buttons default to `type="button"` so a stray click inside a form cannot
 * submit it accidentally.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg border font-medium ' +
  'transition-colors duration-150 ease-standard ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border-terracotta bg-terracotta text-white hover:border-terracotta-ink hover:bg-terracotta-ink',
  secondary: 'border-border-strong bg-white text-cocoa hover:bg-ivory',
  outline: 'border-terracotta-ink bg-transparent text-terracotta-ink hover:bg-terracotta/10',
  ghost: 'border-transparent bg-transparent text-link hover:bg-sand/60 hover:text-cocoa',
  inverse:
    'border-white/35 bg-transparent text-ivory hover:border-white/55 hover:bg-white/10 hover:text-white',
  danger: 'border-danger bg-danger text-white hover:border-danger/90 hover:bg-danger/90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[length:var(--text-label)] leading-none',
  md: 'h-11 px-5 text-[length:var(--text-body-sm)] leading-none',
  lg: 'h-12 px-6 text-[length:var(--text-body)] leading-none',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/** Shared class recipe, so anchors and buttons look identical. */
export function buttonStyles(options: ButtonStyleOptions = {}): string {
  const { variant = 'primary', size = 'md', fullWidth = false } = options;
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth ? 'w-full' : undefined);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows a spinner, disables the control and sets `aria-busy`. */
  isLoading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  iconLeft,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      disabled={rest.disabled === true || isLoading}
      aria-busy={isLoading ? true : undefined}
    >
      {isLoading ? <LoaderIcon size={16} className="animate-spin" /> : iconLeft}
      <span>{children}</span>
      {isLoading ? null : iconRight}
    </button>
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/** A link styled as a button — still a real anchor for navigation. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={cn(buttonStyles({ variant, size, fullWidth }), className)} {...rest}>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </a>
  );
}
