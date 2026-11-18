'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AudioLines,
  BadgePlus,
  BarChart3,
  Bell,
  CalendarCheck2,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Gavel,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquareWarning,
  QrCode,
  ReceiptText,
  Settings,
  Sparkles,
  Star,
  Timer,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/brand';
import { Button, Spinner } from '@/components/ui/primitives';
import { Drawer } from '@/components/ui/overlay';
import { ADMIN_NAV } from '@/lib/constants';
import { adminApi } from '@/services/adminApi';
import { useAuthStore, isAdminRole } from '@/stores/authStore';
import { useUiStore, toast } from '@/stores/uiStore';
import { cn, formatDateTime } from '@/lib/utils';

const ICONS = {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Timer,
  ReceiptText,
  CreditCard,
  AudioLines,
  Users,
  UserRound,
  Sparkles,
  MapPin,
  QrCode,
  Star,
  HandCoins,
  Trophy,
  MessageSquareWarning,
  Gavel,
  CalendarCheck2,
  BadgePlus,
  Settings,
};

function NavIcon({ name, className }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden="true" />;
}

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({ pathname, onNavigate }) {
  return (
    <nav aria-label="Admin sections" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.group} className="mt-5 first:mt-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{group.group}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition',
                      active
                        ? 'bg-white/10 text-white shadow-insetline'
                        : 'text-white/65 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <NavIcon name={item.icon} className={cn('h-4 w-4 shrink-0', active ? 'text-teal-300' : 'text-white/40')} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NotificationsPanel({ open, onClose }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminApi.notifications.list({ limit: 20 }),
    enabled: open,
    refetchInterval: 60_000,
  });
  const notifications = query.data?.items ?? [];
  const unread = notifications.filter((item) => !item.readAt);

  const markAll = async () => {
    try {
      await adminApi.notifications.markAllRead();
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Notifications cleared');
    } catch (error) {
      toast.error('Could not update notifications', error?.message);
    }
  };

  const markOne = async (id) => {
    try {
      await adminApi.notifications.markRead(id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    } catch {
      // Non-critical.
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Notifications"
      description="Operational alerts from the venue."
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" size="sm" onClick={markAll} disabled={!unread.length}>
            Mark all read
          </Button>
        </div>
      }
    >
      {query.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-navy-500">No notifications yet.</p>
      ) : (
        <ul className="divide-y divide-navy-100">
          {notifications.map((item) => {
            const unreadItem = !item.readAt;
            return (
              <li key={item.id} className="py-3 first:pt-0">
                <button
                  type="button"
                  onClick={() => unreadItem && markOne(item.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={cn(
                      'mt-1 inline-flex h-2 w-2 shrink-0 rounded-full',
                      unreadItem ? 'bg-teal-500' : 'bg-transparent',
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-navy-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">{item.body}</span>
                    <span className="mt-1 block text-[11px] text-navy-400">{formatDateTime(item.createdAt)}</span>
                  </span>
                  {unreadItem ? <Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-2 py-1.5 text-left transition hover:border-navy-200"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-[11px] font-semibold text-white">
          {(user?.name ?? 'A')
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[140px] truncate text-xs font-semibold text-navy-900">{user?.name ?? 'Admin'}</span>
          <span className="block text-[10px] uppercase tracking-wider text-navy-400">
            {(user?.role ?? '').replace('_', ' ')}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-navy-400" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lift"
        >
          <div className="border-b border-navy-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-navy-900">{user?.name}</p>
            <p className="truncate text-xs text-navy-500">{user?.email ?? user?.identifier ?? ''}</p>
          </div>
          <Link
            href="/"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 transition hover:bg-navy-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View public site
          </Link>
          <Link
            href="/admin/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 transition hover:bg-navy-50"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Account & settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const logout = useAuthStore((state) => state.logout);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  const notificationsQuery = useQuery({
    queryKey: ['admin', 'notifications', 'badge'],
    queryFn: () => adminApi.notifications.list({ limit: 20 }),
    enabled: status === 'authenticated',
    refetchInterval: 60_000,
  });
  const unreadCount = useMemo(
    () => (notificationsQuery.data?.items ?? []).filter((item) => !item.readAt).length,
    [notificationsQuery.data],
  );

  const title = useMemo(() => {
    const all = ADMIN_NAV.flatMap((group) => group.items);
    const match = all
      .filter((item) => isActive(pathname, item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.label ?? 'Admin';
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
    router.replace('/admin/login');
  }, [logout, queryClient, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sand-50">
        <Spinner />
        <p className="text-sm font-medium text-navy-500">Opening your admin session…</p>
      </div>
    );
  }

  if (status !== 'authenticated' || !isAdminRole(user?.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sand-50 px-6 text-center">
        <Spinner />
        <p className="text-sm font-medium text-navy-500">
          {status === 'authenticated' ? 'This account does not have admin access.' : 'Redirecting to sign in…'}
        </p>
        {status === 'authenticated' ? (
          <Button size="sm" variant="secondary" onClick={handleLogout}>
            Sign in with another account
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link href="/admin/dashboard" aria-label="HELPY admin dashboard">
            <Logo color="white" />
          </Link>
        </div>
        <SidebarNav pathname={pathname} />
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Signed in as</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-white/80">{user?.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-teal-300">{(user?.role ?? '').replace('_', ' ')}</p>
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-navy-950">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo color="white" />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy-600 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400">HELPY console</p>
            <h1 className="truncate font-display text-base font-semibold text-navy-900">{title}</h1>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 text-navy-600 transition hover:border-navy-200 hover:text-navy-900"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          <UserMenu user={user} onLogout={handleLogout} />
        </header>

        <main id="main" className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </main>
      </div>

      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
