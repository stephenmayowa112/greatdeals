import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'DealPulse – Curated Deals Discovery',
  description: 'A scrollable feed of curated deals, promo codes, and discount sales with outbound merchant links and cursor-based pagination.',
  openGraph: {
    title: 'DealPulse – Curated Deals Discovery',
    description: 'A scrollable feed of curated deals, promo codes, and discount sales with outbound merchant links and cursor-based pagination.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DealPulse – Curated Deals Discovery',
    description: 'A scrollable feed of curated deals, promo codes, and discount sales with outbound merchant links and cursor-based pagination.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
