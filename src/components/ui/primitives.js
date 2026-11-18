import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-navy-900 text-white shadow-soft hover:bg-navy-800 active:bg-navy-950 disabled:bg-navy-300',
  accent:
    'bg-teal-600 text-white shadow-soft hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300',
  secondary:
    'bg-white text-navy-900 border border-navy-200 shadow-sm hover:border-navy-300 hover:bg-navy-50 disabled:text-navy-400',
  soft: 'bg-navy-50 text-navy-800 hover:bg-navy-100 disabled:text-navy-400',
  ghost: 'text-navy-700 hover:bg-navy-50 hover:text-navy-900 disabled:text-navy-300',
  danger: 'bg-red-600 text-white shadow-soft hover:bg-red-700 disabled:bg-red-300',
  dangerSoft: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
  success: 'bg-emerald-600 text-white shadow-soft hover:bg-emerald-700',
  outlineLight: 'border border-white/30 text-white hover:bg-white/10',
};

const SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

export function LinkButton({ href, variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

const TONES = {
  neutral: 'bg-navy-50 text-navy-700 ring-navy-200',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  navy: 'bg-navy-900 text-white ring-navy-900',
};

export function Badge({ tone = 'neutral', className, children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-2xl border border-navy-100 bg-white shadow-soft', className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-navy-100 px-5 py-4', className)}>
      <div>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-navy-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-relaxed text-navy-600">{description}</p> : null}
    </div>
  );
}

export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-navy-500', className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />;
}

export function Divider({ className }) {
  return <hr className={cn('border-t border-navy-100', className)} />;
}

const AVATAR_SIZES = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' };

export function Avatar({ name, size = 'sm', className }) {
  const label = String(name || 'HELPY')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-700 ring-1 ring-inset ring-navy-200',
        AVATAR_SIZES[size],
        className,
      )}
      aria-hidden="true"
    >
      {label || 'H'}
    </span>
  );
}

export function ProgressBar({ value, max = 100, tone = 'teal', className, label }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (Number(value) / Number(max)) * 100 : 0));
  const tones = { teal: 'bg-teal-500', navy: 'bg-navy-800', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-navy-100', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-all duration-300', tones[tone] ?? tones.teal)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Alert({ tone = 'info', title, children, className }) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  };
  return (
    <div role="alert" className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone] ?? tones.info, className)}>
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon ? (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-base font-semibold text-navy-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this', className }) {
  const message = typeof error === 'string' ? error : error?.message;
  return (
    <div role="alert" className={cn('rounded-2xl border border-red-200 bg-red-50/70 px-5 py-8 text-center', className)}>
      <p className="text-sm font-semibold text-red-900">{title}</p>
      {message ? <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

const STAT_TONES = {
  navy: 'bg-navy-50 text-navy-700',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'navy', href, className }) {
  const content = (
    <div
      className={cn(
        'rounded-2xl border border-navy-100 bg-white p-5 shadow-soft transition',
        href && 'hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        {Icon ? (
          <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg', STAT_TONES[tone] ?? STAT_TONES.navy)}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-navy-500">{hint}</p> : null}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
        {content}
      </a>
    );
  }
  return content;
}

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
