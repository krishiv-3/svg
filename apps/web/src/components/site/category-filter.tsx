import { cn } from '@/lib/cn';

/**
 * Link-based category filter.
 *
 * Filtering is a server concern: each option is a real URL (`?category=…`), so
 * the result is shareable, crawlable, works without JavaScript and needs no
 * client state. The current option is marked with `aria-current`.
 *
 * Selecting "All" removes the parameter rather than setting an empty one.
 */
export interface CategoryFilterProps {
  /** Base path, e.g. `/news`. */
  basePath: string;
  options: readonly string[];
  /** Currently selected category, if any. */
  active?: string;
  /** Accessible name for the navigation landmark. */
  label: string;
  className?: string;
}

const CHIP =
  'text-[length:var(--text-label)] inline-flex h-9 items-center rounded-full border px-3.5 font-medium transition-colors duration-150 ease-standard';

export function CategoryFilter({
  basePath,
  options,
  active,
  label,
  className,
}: CategoryFilterProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap gap-2">
        <li>
          <a
            href={basePath}
            aria-current={active === undefined ? 'page' : undefined}
            className={cn(
              CHIP,
              active === undefined
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-sand bg-white text-cocoa hover:bg-sand/60',
            )}
          >
            All
          </a>
        </li>

        {options.map((option) => {
          const isActive = active === option;

          return (
            <li key={option}>
              <a
                href={`${basePath}?category=${encodeURIComponent(option)}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  CHIP,
                  isActive
                    ? 'border-cocoa bg-cocoa text-ivory'
                    : 'border-sand bg-white text-cocoa hover:bg-sand/60',
                )}
              >
                {option}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
