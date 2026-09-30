import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealCard from '@/components/DealCard';
import { db } from '@/lib/db';
import { formatNaira } from '@/lib/utils';
import {
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  Tag,
  ArrowLeft,
  Calendar,
  ShoppingBag,
} from 'lucide-react';

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { id } = await params;
  const deal = db.getDealById(id);

  if (!deal) {
    return {
      title: 'Deal Not Found – DealPulse',
      description: 'The requested deal offer could not be found or has expired.',
    };
  }

  const discountText = deal.percentage_off ? `${deal.percentage_off}% Off` : 'Special Promo';
  const priceText = deal.discounted_price ? formatNaira(deal.discounted_price) : '';
  const title = `${deal.title} – ${discountText} at ${deal.source_name}`;
  const description = `${deal.short_description} Save on this verified deal at ${deal.source_name}. ${priceText}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: deal.image ? [{ url: deal.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: deal.image ? [deal.image] : undefined,
    },
  };
}

export default async function DealDetailPage({ params }: DealPageProps) {
  const { id } = await params;
  const deal = db.getDealById(id);

  if (!deal) {
    notFound();
  }

  // Related deals from the same category (excluding current deal)
  const relatedResponse = db.getDeals({
    category: deal.category?.slug,
    limit: 4,
    status: 'live',
  });
  const relatedDeals = relatedResponse.items.filter((d) => d.id !== deal.id).slice(0, 3);

  // Compute savings
  const nairaSavings =
    deal.original_price && deal.discounted_price
      ? formatNaira(deal.original_price - deal.discounted_price)
      : null;

  // JSON-LD structured data for Product & Offer
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    description: deal.short_description,
    image: deal.image || undefined,
    brand: {
      '@type': 'Brand',
      name: deal.source_name,
    },
    category: deal.category?.name,
    offers: {
      '@type': 'Offer',
      price: deal.discounted_price || deal.original_price || 0,
      priceCurrency: 'NGN',
      priceValidUntil: deal.expires_at || undefined,
      url: deal.source_url,
      availability:
        deal.status === 'live'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/Discontinued',
      seller: {
        '@type': 'Organization',
        name: deal.source_name,
      },
    },
  };

  const isExpired = deal.status === 'expired';

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Bar */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to feed</span>
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/?category=${deal.category?.slug}`}
              className="hover:text-neutral-900 transition-colors"
            >
              {deal.category?.name || 'Category'}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate max-w-xs text-neutral-800 font-medium">{deal.title}</span>
          </nav>

          {/* Expired warning if viewed directly */}
          {isExpired && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <span className="font-semibold">Notice:</span> This promotional deal is past its expiration date or marked expired. Pricing or availability on the merchant site may no longer apply.
            </div>
          )}

          {/* Main Deal Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Column (Left, 7 cols) */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-neutral-100">
                {deal.image ? (
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 p-8 text-neutral-400">
                    <ShoppingBag className="h-16 w-16 stroke-1 text-neutral-400" />
                    <span className="mt-3 text-sm font-medium text-neutral-500">
                      {deal.source_name} Listing
                    </span>
                  </div>
                )}

                {deal.percentage_off && deal.percentage_off > 0 && (
                  <div className="absolute top-4 left-4 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white shadow-md">
                    -{deal.percentage_off}% Discount
                  </div>
                )}
              </div>

              {/* Deal Overview details */}
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  Deal Overview
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  {deal.short_description}
                </p>

                <div className="mt-6 border-t border-neutral-100 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Retailer / Source</span>
                    <span className="font-semibold text-neutral-800">{deal.source_name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Category</span>
                    <span className="font-semibold text-neutral-800">{deal.category?.name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Posted Date</span>
                    <span className="font-semibold text-neutral-800">
                      {new Date(deal.posted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module (Right, 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
                {/* Quiet metadata line */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-800">{deal.source_name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{deal.category?.name}</span>
                  {deal.status === 'live' ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium">Verified Active</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-neutral-500 capitalize">{deal.status}</span>
                    </>
                  )}
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 leading-snug">
                  {deal.title}
                </h1>

                {/* Price calculation block */}
                <div className="mt-6 rounded-xl bg-neutral-50 p-4 border border-neutral-200/60">
                  <div className="flex items-baseline gap-3">
                    {deal.discounted_price !== null && deal.discounted_price !== undefined ? (
                      <>
                        <span className="font-mono text-3xl font-bold tabular-nums text-neutral-900">
                          {formatNaira(deal.discounted_price)}
                        </span>
                        {deal.original_price && (
                          <span className="font-mono text-base tabular-nums text-neutral-400 line-through">
                            {formatNaira(deal.original_price)}
                          </span>
                        )}
                      </>
                    ) : deal.original_price !== null && deal.original_price !== undefined ? (
                      <span className="font-mono text-2xl font-bold tabular-nums text-neutral-900">
                        {formatNaira(deal.original_price)}
                      </span>
                    ) : (
                      <span className="text-base font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Tag className="h-4 w-4" /> Promotional Discount
                      </span>
                    )}
                  </div>

                  {nairaSavings && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      You save {nairaSavings} ({deal.percentage_off}% off regular retail)
                    </p>
                  )}

                  {deal.expires_at && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 border-t border-neutral-200/60 pt-2">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      <span>
                        Offer valid until{' '}
                        {new Date(deal.expires_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Outbound Action */}
                <div className="mt-6 space-y-3">
                  <a
                    href={deal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-99"
                  >
                    <span>Get deal at {deal.source_name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <p className="text-center text-xs text-neutral-400">
                    Links directly to retailer checkout. DealPulse does not sell or process payments.
                  </p>
                </div>

                {/* Guarantee & Outbound transparency */}
                <div className="mt-6 border-t border-neutral-100 pt-4 space-y-2 text-xs text-neutral-500">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-neutral-700 shrink-0 mt-0.5" />
                    <span>Verified outbound link directed to the official merchant domain.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Deals in this Category */}
          {relatedDeals.length > 0 && (
            <div className="mt-16 border-t border-neutral-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">
                  More in {deal.category?.name}
                </h2>
                <Link
                  href={`/?category=${deal.category?.slug}`}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  <span>View all</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedDeals.map((item) => (
                  <DealCard key={item.id} deal={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
