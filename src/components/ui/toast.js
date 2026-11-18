'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const VARIANTS = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-white text-emerald-700' },
  error: { icon: XCircle, className: 'border-red-200 bg-white text-red-700' },
  warning: { icon: AlertTriangle, className: 'border-amber-200 bg-white text-amber-700' },
  info: { icon: Info, className: 'border-sky-200 bg-white text-sky-700' },
};

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const variant = VARIANTS[toast.variant] ?? VARIANTS.info;
        const Icon = variant.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lift animate-slide-up',
              variant.className,
            )}
            role="status"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.description ? <p className="mt-0.5 text-sm text-navy-600">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-navy-400 transition hover:text-navy-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
