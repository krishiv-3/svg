import { cn } from '@/lib/cn';

import { ChevronRightIcon } from '../icons';

/**
 * Pagination.
 *
 * A navigation landmark with an ordered list of real links, so it works without
 * JavaScript and each page is crawlable. The current page is marked with
 * `aria-current="page"` and is not a link.
 *
 * Gaps collapse to an ellipsis; the first and last page are always reachable.
 */

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Builds a crawlable href for a page number. */
  hrefFor: (page: number) => string;
  /** Accessible name for the landmark. */
  label?: string;
  className?: string;
}

function pageItems(currentPage: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('gap');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('gap');

  items.push(totalPages);
  return items;
}

const BASE_ITEM =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2.5 ' +
  'text-[length:var(--text-label)] font-medium transition-colors duration-150 ease-standard';

export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
  label = 'Pagination',
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label={label} className={cn('flex justify-center', className)}>
      <ul className="flex items-center gap-1">
        <li>
          {hasPrevious ? (
            <a
              href={hrefFor(currentPage - 1)}
              rel="prev"
              className={cn(BASE_ITEM, 'text-cocoa hover:bg-sand/60')}
            >
              <ChevronRightIcon size={16} className="rotate-180" />
              <span className="ml-1 hidden sm:inline">Previous</span>
              <span className="visually-hidden sm:hidden">Previous page</span>
            </a>
          ) : (
            <span aria-hidden="true" className={cn(BASE_ITEM, 'cursor-not-allowed text-muted/60')}>
              <ChevronRightIcon size={16} className="rotate-180" />
              <span className="ml-1 hidden sm:inline">Previous</span>
            </span>
          )}
        </li>

        {/* Compact summary for narrow screens: full page numbers do not fit. */}
        <li className="px-1 sm:hidden">
          <span className="text-[length:var(--text-caption)] whitespace-nowrap text-muted">
            Page <span className="font-semibold text-cocoa">{currentPage}</span> of {totalPages}
          </span>
        </li>

        {pageItems(currentPage, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li
              key={`gap-${String(index)}`}
              aria-hidden="true"
              className={cn(BASE_ITEM, 'hidden text-muted sm:inline-flex')}
            >
              …
            </li>
          ) : (
            <li key={item} className="hidden sm:block">
              <a
                href={hrefFor(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Page ${String(item)}`}
                className={cn(
                  BASE_ITEM,
                  item === currentPage ? 'bg-cocoa text-ivory' : 'text-cocoa hover:bg-sand/60',
                )}
              >
                {item}
              </a>
            </li>
          ),
        )}

        <li>
          {hasNext ? (
            <a
              href={hrefFor(currentPage + 1)}
              rel="next"
              className={cn(BASE_ITEM, 'text-cocoa hover:bg-sand/60')}
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <span className="visually-hidden sm:hidden">Next page</span>
              <ChevronRightIcon size={16} />
            </a>
          ) : (
            <span aria-hidden="true" className={cn(BASE_ITEM, 'cursor-not-allowed text-muted/60')}>
              <span className="mr-1 hidden sm:inline">Next</span>
              <ChevronRightIcon size={16} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
