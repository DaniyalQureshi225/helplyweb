'use client';

import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_TONES } from '@/lib/constants';
import { Badge, EmptyState, ErrorState, Skeleton } from './primitives';

export { StatCard, PageHeader } from './primitives';

export function StatusBadge({ status, label, className }) {
  if (!status) return <span className="text-sm text-navy-400">—</span>;
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} className={className} dot>
      {label ?? STATUS_LABELS[status] ?? String(status).replaceAll('_', ' ')}
    </Badge>
  );
}

export function DataTable({ columns, rows = [], loading = false, error, onRetry, emptyTitle = 'Nothing here yet', emptyDescription, onRowClick, getRowId, footer, className }) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-soft', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-navy-500',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100/80">
            {loading
              ? Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4">
                        <Skeleton className="h-4" style={{ width: `${55 + ((rowIndex * 13 + column.key.length * 7) % 40)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => (
                  <tr
                    key={getRowId ? getRowId(row) : row.id ?? index}
                    className={cn('transition', onRowClick && 'cursor-pointer hover:bg-navy-50/60')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === 'Enter') onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3.5 align-middle text-navy-700',
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center',
                          column.className,
                        )}
                      >
                        {column.cell ? column.cell(row) : row[column.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && !rows.length ? (
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      ) : null}
      {footer ? <div className="border-t border-navy-100 px-4 py-3">{footer}</div> : null}
    </div>
  );
}

export function Pagination({ page = 1, totalPages = 0, total, limit, onChange, className }) {
  if (!totalPages || totalPages <= 1) {
    return total !== undefined ? (
      <p className="text-xs text-navy-500">
        {total} {total === 1 ? 'record' : 'records'}
      </p>
    ) : null;
  }

  const pages = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  for (let i = start; i <= Math.min(totalPages, start + 2); i += 1) pages.push(i);

  return (
    <nav className={cn('flex flex-wrap items-center justify-between gap-3', className)} aria-label="Pagination">
      <p className="text-xs text-navy-500">
        Page {page} of {totalPages}
        {total !== undefined ? ` · ${total} records` : ''}
        {limit ? ` · ${limit} per page` : ''}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange?.(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-navy-200 text-navy-600 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 ? <span className="px-1 text-xs text-navy-400">…</span> : null}
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange?.(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
              item === page ? 'bg-navy-900 text-white' : 'text-navy-600 hover:bg-navy-50',
            )}
          >
            {item}
          </button>
        ))}
        {start + 2 < totalPages ? <span className="px-1 text-xs text-navy-400">…</span> : null}
        <button
          type="button"
          onClick={() => onChange?.(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-navy-200 text-navy-600 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

export function DetailList({ items, className, columns = 1 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">{item.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-navy-800">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-xl bg-navy-50 p-1 no-scrollbar', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition',
            value === tab.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? <span className="ml-1.5 text-xs text-navy-400">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}


