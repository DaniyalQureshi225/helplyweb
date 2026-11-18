import { CustomerShell } from '@/components/layout/customer-shell';

export const metadata = {
  title: 'Get assistance',
  description: 'Request a verified HELPY helper at your venue.',
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }) {
  return <CustomerShell>{children}</CustomerShell>;
}
