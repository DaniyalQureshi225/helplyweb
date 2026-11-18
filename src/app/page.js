import { MarketingShell } from '@/components/layout/marketing-shell';
import {
  CtaBand,
  Experience,
  FaqSection,
  Hero,
  HowItWorks,
  Locations,
  ServicesSection,
  WhyHelpy,
} from '@/components/marketing/sections';
import { getPricing, getQrCatalog } from '@/lib/serverApi';

export const metadata = {
  title: 'HELPY — Your Comfort, Our Priority.',
  description:
    'Scan a QR code and get trusted, in-person assistance at hotels, malls, airports and public places. Transparent billing, live tracking, and verified helpers.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [catalog, pricing] = await Promise.all([getQrCatalog(), getPricing()]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'HELPY',
    slogan: 'Your Comfort, Our Priority.',
    description:
      'On-site guest assistance at hotels, shopping malls, airports and public places, requested by scanning a QR code.',
    areaServed: 'Pakistan',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  };

  return (
    <MarketingShell>
      <script
        type="application/ld+json"
        // Structured data is static and contains no user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero pricing={pricing ?? catalog?.pricing} />
      <HowItWorks />
      <ServicesSection catalog={catalog} pricing={pricing} />
      <WhyHelpy />
      <Locations />
      <Experience />
      <FaqSection />
      <CtaBand />
    </MarketingShell>
  );
}
