import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Layout primitives.
 *
 * `Container` owns horizontal rhythm; `Section` owns vertical rhythm and
 * surface tone. Pages compose sections; components never set their own outer
 * margins.
 */

export type ContainerSize = 'narrow' | 'prose' | 'content' | 'wide';

const CONTAINER_CLASS: Record<ContainerSize, string> = {
  narrow: 'container-page max-w-narrow',
  prose: 'container-page max-w-prose',
  content: 'container-page',
  wide: 'container-wide',
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children?: ReactNode;
}

export function Container({ size = 'content', className, children, ...rest }: ContainerProps) {
  return (
    <div {...rest} className={cn(CONTAINER_CLASS[size], className)}>
      {children}
    </div>
  );
}

export type SectionTone = 'default' | 'muted' | 'inverse' | 'accent';
export type SectionSpacing = 'compact' | 'default' | 'spacious';

const SECTION_TONE: Record<SectionTone, string> = {
  default: 'bg-ivory',
  muted: 'bg-sand/40',
  inverse: 'bg-cocoa text-ivory',
  accent: 'bg-white',
};

const SECTION_SPACING: Record<SectionSpacing, string> = {
  compact: 'py-12 sm:py-16',
  default: 'py-16 sm:py-20 lg:py-24',
  spacious: 'py-20 sm:py-24 lg:py-32',
};

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  spacing?: SectionSpacing;
  children?: ReactNode;
}

export function Section({
  tone = 'default',
  spacing = 'default',
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      {...rest}
      className={cn(
        SECTION_TONE[tone],
        SECTION_SPACING[spacing],
        // Keep anchored sections clear of the sticky header.
        'scroll-mt-24',
        className,
      )}
    >
      {children}
    </section>
  );
}
