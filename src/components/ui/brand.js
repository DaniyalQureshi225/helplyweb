import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, color = 'navy', showTagline = false }) {
  const dark = color === 'white';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm',
          dark ? 'bg-white text-navy-900' : 'bg-navy-900 text-white',
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M8.4 4.6a2.2 2.2 0 0 1 3.1 0l.5.5.5-.5a2.2 2.2 0 1 1 3.1 3.1l-3.6 3.6a.7.7 0 0 1-1 0L7.4 7.7a2.2 2.2 0 0 1 1-3.1Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M6.2 12.2h11.6a1.3 1.3 0 0 1 1.3 1.3v3.2a2.7 2.7 0 0 1-2.7 2.7H7.6a2.7 2.7 0 0 1-2.7-2.7v-3.2a1.3 1.3 0 0 1 1.3-1.3Z"
            fill="currentColor"
            opacity="0.55"
          />
          <path d="M9.2 14.6v2.1M14.8 14.6v2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={cn('block font-display text-[19px] font-bold tracking-[0.12em]', dark ? 'text-white' : 'text-navy-900')}>
          HELPY
        </span>
        {showTagline ? (
          <span className={cn('mt-1 block text-[10px] font-medium tracking-wide', dark ? 'text-white/70' : 'text-navy-500')}>
            Your Comfort, Our Priority.
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function BrandLink({ href = '/', color = 'navy', className }) {
  return (
    <Link href={href} className={cn('rounded-lg', className)} aria-label="HELPY home">
      <Logo color={color} />
    </Link>
  );
}
