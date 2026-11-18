'use client';

import { forwardRef, useId } from 'react';
import { AlertCircle, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({ label, htmlFor, hint, error, required, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} className={cn('input-base', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/10', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn('input-base resize-y', invalid && 'border-red-400 focus:border-red-500 focus:ring-red-500/10', className)}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn('input-base appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-9', invalid && 'border-red-400', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2361728a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({ label, description, className, id, error, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
          {...props}
        />
        <label htmlFor={inputId} className="cursor-pointer text-sm leading-relaxed text-navy-700">
          {label}
          {description ? <span className="mt-0.5 block text-xs text-navy-500">{description}</span> : null}
        </label>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function ChoiceCard({ checked, onChange, value, title, description, icon: Icon, disabled, name }) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
        checked ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20' : 'border-navy-200 bg-white hover:border-navy-300',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      {Icon ? (
        <span className={cn('mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', checked ? 'bg-teal-100 text-teal-700' : 'bg-navy-50 text-navy-500')}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">{title}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">{description}</span> : null}
      </span>
      <span
        className={cn(
          'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-300 bg-white',
        )}
        aria-hidden="true"
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-base pl-9"
        aria-label={placeholder}
        {...props}
      />
    </div>
  );
}

export function FormError({ message, className }) {
  if (!message) return null;
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700', className)} role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
