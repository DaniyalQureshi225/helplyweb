'use client';

import { usePathname } from 'next/navigation';
import { AdminShell } from './admin-shell';

/**
 * The login screen shares the /admin route segment but must not render the
 * authenticated chrome. Everything else is guarded by AdminShell.
 */
export function AdminFrame({ children }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return children;
  return <AdminShell>{children}</AdminShell>;
}
