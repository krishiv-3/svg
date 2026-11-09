import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { SearchIcon } from '../icons';

/**
 * Search input.
 *
 * A labelled search field used in the admin filter bar and, later, the public
 * site search. The label is visually hidden by default because the icon and
 * placeholder communicate the purpose visually — but it is always present for
 * assistive technology, so the field is never unlabelled.
 */

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> {
  id: string;
  label?: string;
  hideLabel?: boolean;
  className?: string;
}

export function SearchInput({
  id,
  label = 'Search',
  hideLabel = true,
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label
        htmlFor={id}
        className={hideLabel ? 'visually-hidden' : 'text-label mb-1.5 font-medium text-cocoa'}
      >
        {label}
      </label>

      <div className="relative">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          {...rest}
          id={id}
          type="search"
          className="border-border-strong h-10 w-full rounded-lg border bg-white py-2 pr-3 pl-9 text-[length:var(--text-body-sm)] text-charcoal placeholder:text-muted/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa"
        />
      </div>
    </div>
  );
}
