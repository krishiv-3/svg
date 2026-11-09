'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { ChevronDownIcon } from '../icons';

/**
 * Action menu.
 *
 * A small dropdown for row actions and account menus. Keyboard contract:
 *  - the trigger is a real button with `aria-haspopup="menu"` and `aria-expanded`;
 *  - opening moves focus to the first item;
 *  - `ArrowDown` / `ArrowUp` cycle, `Home` / `End` jump, `Escape` closes and
 *    returns focus to the trigger, `Tab` closes and continues naturally;
 *  - clicking outside closes without stealing focus.
 */

export interface ActionMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ActionMenuProps {
  /** Accessible name for the trigger, e.g. "Actions for Sample item 01". */
  label: string;
  items: readonly ActionMenuItem[];
  /** Custom trigger content; defaults to a "Actions" label with a chevron. */
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function ActionMenu({ label, items, trigger, align = 'right', className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    // Focus the first item so keyboard users land inside the menu.
    itemRefs.current[0]?.focus();

    const onPointerDown = (event: MouseEvent): void => {
      if (containerRef.current !== null && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const focusItem = (index: number): void => {
    const count = items.length;
    if (count === 0) return;
    const next = (index + count) % count;
    itemRefs.current[next]?.focus();
  };

  const handleItemKeyDown = (event: React.KeyboardEvent, index: number): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(items.length - 1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-transparent px-2.5',
          'text-[length:var(--text-label)] font-medium text-cocoa',
          'hover:border-sand hover:bg-ivory',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa',
        )}
      >
        {trigger ?? 'Actions'}
        <ChevronDownIcon
          size={14}
          className={cn('transition-transform', open ? 'rotate-180' : undefined)}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-dropdown mt-1 min-w-48 overflow-hidden rounded-lg border border-sand bg-white py-1 shadow-overlay',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => {
            const shared = {
              role: 'menuitem',
              tabIndex: -1,
              className: cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[length:var(--text-body-sm)]',
                'focus-visible:bg-sand/60 focus-visible:outline-none',
                item.disabled === true
                  ? 'cursor-not-allowed text-muted/60'
                  : item.tone === 'danger'
                    ? 'text-danger hover:bg-danger/5'
                    : 'text-charcoal hover:bg-ivory',
              ),
              onKeyDown: (event: React.KeyboardEvent) => {
                handleItemKeyDown(event, index);
              },
            };

            return item.href === undefined ? (
              <button
                key={item.label}
                type="button"
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled === true) return;
                  setOpen(false);
                  item.onSelect?.();
                }}
                {...shared}
              >
                {item.icon}
                {item.label}
              </button>
            ) : (
              <a
                key={item.label}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                }}
                {...shared}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
