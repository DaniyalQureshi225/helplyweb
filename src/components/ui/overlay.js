'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './primitives';

function useModalBehaviour(open, onClose) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus], input, textarea, select, button');
      target?.focus?.();
    }, 40);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  return panelRef;
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const panelRef = useModalBehaviour(open, onClose);
  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift animate-slide-up sm:rounded-2xl',
          sizes[size] ?? sizes.md,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-navy-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-navy-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">{children}</div>
        {footer ? <div className="border-t border-navy-100 bg-navy-50/40 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, description, children, footer, side = 'right', width = 'max-w-lg' }) {
  const panelRef = useModalBehaviour(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-navy-950/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'absolute inset-y-0 flex w-full flex-col bg-white shadow-lift animate-fade-in',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          'border-navy-100',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-navy-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-navy-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">{children}</div>
        {footer ? <div className="border-t border-navy-100 bg-navy-50/40 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Please confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : tone === 'success' ? 'success' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}
