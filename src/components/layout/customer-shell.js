'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Headphones, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/brand';
import { useCustomerStore } from '@/stores/customerStore';
import { cn } from '@/lib/utils';

const STEPS = ['Request', 'Track', 'Service', 'Bill & review'];

function activeStep(pathname) {
  if (pathname.includes('/track/')) return 1;
  if (pathname.includes('/service/')) return 2;
  if (pathname.includes('/bill/') || pathname.includes('/review/')) return 3;
  return 0;
}

export function CustomerShell({ children }) {
  const pathname = usePathname();
  const location = useCustomerStore((state) => state.location);
  const qr = useCustomerStore((state) => state.qr);
  const step = activeStep(pathname);
  const showSteps = !/^\/customer\/[^/]+$/.test(pathname) || Boolean(location);

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="sticky top-0 z-40 bg-navy-950 text-white shadow-soft">
        <div className="mx-auto w-full max-w-2xl px-4 pb-3 pt-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/customer/request" aria-label="HELPY assistance" className="rounded-lg">
              <Logo color="white" />
            </Link>
            <div className="min-w-0 text-right">
              <p className="truncate text-xs font-semibold text-white/90">{location?.name ?? 'Guest assistance'}</p>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-wider text-teal-300">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Secure guest session
              </p>
            </div>
          </div>

          {showSteps ? (
            <ol className="mt-4 flex items-center gap-1" aria-label="Assistance progress">
              {STEPS.map((label, index) => {
                const done = index < step;
                const current = index === step;
                return (
                  <li key={label} className="flex flex-1 flex-col gap-1.5">
                    <span
                      className={cn(
                        'h-1 rounded-full transition',
                        done || current ? 'bg-teal-400' : 'bg-white/15',
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'truncate text-[10px] font-medium tracking-wide',
                        current ? 'text-white' : done ? 'text-teal-200' : 'text-white/40',
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-14 pt-5 sm:px-6 sm:pt-7">
        {children}
      </main>

      <footer className="border-t border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2 px-4 py-6 text-center sm:px-6">
          <p className="flex items-center gap-1.5 text-xs font-medium text-navy-500">
            <Headphones className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
            Need a person? Ask the front desk or{' '}
            <Link href="/contact" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
              contact HELPY
            </Link>
          </p>
          <p className="text-[11px] text-navy-400">HELPY · Your Comfort, Our Priority.</p>
          <div className="flex gap-4 text-[11px] text-navy-400">
            <Link href="/privacy" className="hover:text-navy-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-navy-700">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
