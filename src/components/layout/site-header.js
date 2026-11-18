'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, QrCode, X } from 'lucide-react';
import { PUBLIC_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/brand';
import { LinkButton } from '@/components/ui/primitives';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition',
        scrolled ? 'border-navy-100 shadow-sm' : 'border-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" aria-label="HELPY home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition',
                  active ? 'bg-navy-50 text-navy-900' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/admin/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-navy-500 transition hover:text-navy-900"
          >
            Staff sign in
          </Link>
          <LinkButton href="/get-assistance" size="sm">
            <QrCode className="h-4 w-4" aria-hidden="true" />
            Get Assistance
          </LinkButton>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-200 text-navy-700 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-navy-100 bg-white lg:hidden">
          <nav aria-label="Mobile navigation" className="container-page flex flex-col gap-1 py-4">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-navy-700 transition hover:bg-navy-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="rounded-xl px-3 py-3 text-sm font-medium text-navy-500 transition hover:bg-navy-50"
            >
              Staff sign in
            </Link>
            <LinkButton href="/get-assistance" className="mt-2 w-full">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Get Assistance
            </LinkButton>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
