import './globals.css';
import { Providers } from './providers';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'HELPY — Your Comfort, Our Priority.',
    template: '%s · HELPY',
  },
  description:
    'HELPY connects guests with trusted, trained helpers at hotels, malls, airports and public places. Scan a QR code, request assistance, and track your service in real time.',
  applicationName: 'HELPY',
  keywords: [
    'HELPY',
    'guest assistance',
    'service helper',
    'hotel assistance',
    'mall assistance',
    'airport assistance',
    'Pakistan',
  ],
  authors: [{ name: 'HELPY' }],
  openGraph: {
    type: 'website',
    siteName: 'HELPY',
    title: 'HELPY — Your Comfort, Our Priority.',
    description:
      'Trusted assistance wherever you are. Scan, request, and relax while a verified HELPY helper takes care of the rest.',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HELPY — Your Comfort, Our Priority.',
    description: 'Trusted assistance wherever you are. Scan, request, and relax.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#10233D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
