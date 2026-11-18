'use client';

import { Check, Circle, XCircle } from 'lucide-react';
import { REQUEST_STATUS_FLOW, STATUS_LABELS } from '@/lib/constants';
import { cn, formatDateTime } from '@/lib/utils';

const DESCRIPTIONS = {
  CREATED: 'Your request reached the venue team.',
  ASSIGNED: 'A verified helper has been assigned to you.',
  IN_PROGRESS: 'Your helper is with you and the service is running.',
  COMPLETED: 'The service has ended. Your bill is ready.',
};

/**
 * Renders the backend status only. Timestamps are supplied by the API where
 * available — the frontend never advances a step on its own.
 */
export function StatusTimeline({ status, timestamps = {}, className }) {
  const cancelled = status === 'CANCELLED';
  const activeIndex = REQUEST_STATUS_FLOW.indexOf(status);

  if (cancelled) {
    return (
      <div className={cn('rounded-2xl border border-red-200 bg-red-50 p-4', className)}>
        <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          This request was cancelled
        </p>
        <p className="mt-1 text-sm leading-relaxed text-red-700">
          No further helper activity will take place for this request. You can start a new request if you still need
          assistance.
        </p>
      </div>
    );
  }

  return (
    <ol className={cn('space-y-0', className)} aria-label={`Status: ${STATUS_LABELS[status] ?? status}`}>
      {REQUEST_STATUS_FLOW.map((step, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        const upcoming = index > activeIndex;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                  done && 'border-teal-600 bg-teal-600 text-white',
                  current && 'border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-500/10',
                  upcoming && 'border-navy-200 bg-white text-navy-400',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : current ? <Circle className="h-3 w-3 fill-current" /> : index + 1}
              </span>
              {index < REQUEST_STATUS_FLOW.length - 1 ? (
                <span className={cn('my-1 w-px flex-1', done ? 'bg-teal-300' : 'bg-navy-100')} aria-hidden="true" />
              ) : null}
            </div>
            <div className={cn('pb-5', index === REQUEST_STATUS_FLOW.length - 1 && 'pb-0')}>
              <p className={cn('text-sm font-semibold', current ? 'text-navy-900' : done ? 'text-navy-700' : 'text-navy-400')}>
                {STATUS_LABELS[step] ?? step}
              </p>
              <p className={cn('mt-0.5 text-xs leading-relaxed', current ? 'text-navy-600' : 'text-navy-400')}>
                {DESCRIPTIONS[step]}
              </p>
              {timestamps[step] ? (
                <p className="mt-1 text-[11px] font-medium text-teal-700">{formatDateTime(timestamps[step])}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
