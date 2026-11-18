import { AdminFrame } from '@/components/admin/admin-frame';

export const metadata = {
  title: 'Admin console',
  description: 'HELPY venue operations console.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminFrame>{children}</AdminFrame>;
}
