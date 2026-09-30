import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealFeed from '@/components/DealFeed';
import { db } from '@/lib/db';
import { Sparkles, ArrowUpRight, Zap } from 'lucide-react';

export const revalidate = 0; // Dynamic server-side rendering for fresh deal feed

interface PageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category, q } = await searchParams;

  let title = 'DealPulse – Curated Deals Discovery Feed';
  let description =
    'Discover verified deals, promo codes, and discount sales across top retailers with instant outbound links.';

  if (category) {
    const cat = db.getCategoryBySlug(category);
    if (cat) {
      title = `${cat.name} Deals & Promos – DealPulse`;
      description = `Browse the latest discounted ${cat.name.toLowerCase()} offers, price drops, and verified merchant links.`;
    }
  }

  if (q) {
    title = `"${q}" Deals & Discounts – DealPulse`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;

  // Initial server-side query
  const initialData = db.getDeals({
    limit: 8,
    category,
    q,
    status: 'live',
  });

  const categories = db.getCategories();
  const stats = db.getStats();

  // JSON-LD structured data for SEO (ItemList of Products)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Curated Deals Feed',
    description: 'Real-time curated promotional deals with outbound merchant links',
    numberOfItems: initialData.items.length,
    itemListElement: initialData.items.map((deal, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: deal.title,
        description: deal.short_description,
        image: deal.image || undefined,
        offers: {
          '@type': 'Offer',
          price: deal.discounted_price || deal.original_price || 0,
          priceCurrency: 'NGN',
          seller: {
            '@type': 'Organization',
            name: deal.source_name,
          },
          url: deal.source_url,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-neutral-200/80 bg-white pt-12 pb-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-3">
                <span className="flex items-center gap-1 text-neutral-800">
                  <Zap className="h-3.5 w-3.5 fill-neutral-800 text-neutral-800" />
                  Live Verified Deals
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{stats.live} Active Offers</span>
                <span aria-hidden="true">·</span>
                <span>Zero In-App Checkout</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 text-balance">
                High-signal deals from trusted stores, updated live.
              </h1>

              <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed text-balance">
                A streamlined, ad-free feed of genuine promos and sales. Click any listing to redeem directly on the retailer’s official checkout.
              </p>
            </div>
          </div>
        </section>

        {/* Feed & Discovery Section */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-neutral-100" />}>
              <DealFeed
                initialDeals={initialData.items}
                initialCursor={initialData.next_cursor}
                initialHasMore={initialData.has_more}
                initialTotal={initialData.total_matching}
                categories={categories}
                initialCategory={category || 'all'}
                initialQuery={q || ''}
              />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
