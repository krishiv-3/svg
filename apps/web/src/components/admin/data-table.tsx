import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Data table.
 *
 * Semantics first: a real `<table>` with a visually-hidden caption, column
 * scopes and a header row that stays visible when the body scrolls. On narrow
 * screens the table scrolls horizontally inside its own container rather than
 * breaking the page layout.
 *
 * Sorting and pagination controls are intentionally absent until Phase 8, when
 * the real list endpoints exist.
 */

export interface DataTableColumn<T> {
  /** Stable key, also used as the React key for the header cell. */
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Applied to both the header and body cells. */
  className?: string;
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  /** Describes the table for screen readers. Required. */
  caption: string;
  emptyMessage?: string;
  className?: string;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyMessage = 'No records to show.',
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        'border-sand overflow-hidden rounded-xl border bg-white shadow-soft',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="text-[length:var(--text-body-sm)] w-full min-w-[42rem] border-collapse">
          <caption className="visually-hidden">{caption}</caption>

          <thead>
            <tr className="border-b border-sand bg-ivory/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-[length:var(--text-caption)] font-semibold tracking-wide whitespace-nowrap text-cocoa uppercase',
                    ALIGN[column.align ?? 'left'],
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-b border-sand/70 last:border-b-0 hover:bg-ivory/60"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 align-middle text-charcoal',
                        ALIGN[column.align ?? 'left'],
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
