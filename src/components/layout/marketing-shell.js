import { getPublicSettings } from '@/lib/serverApi';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

export async function MarketingShell({ children }) {
  const settings = await getPublicSettings().catch(() => null);
  const support = settings?.['app.info'] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter support={support} />
    </div>
  );
}
