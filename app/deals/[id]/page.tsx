import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealCard from '@/components/DealCard';
import { db } from '@/lib/db';
import { formatNaira, formatUtcDate, formatUtcDateWithYear } from '@/lib/utils';
import {
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  Tag,
  ArrowLeft,
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
    <div className="flex min-h-screen flex-col bg-[#F4F6F9] text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Bar */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/"
              className="hover:text-emerald-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to feed</span>
            </Link>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <Link
              href={`/?category=${deal.category?.slug}`}
              className="hover:text-emerald-700 transition-colors"
            >
              {deal.category?.name || 'Category'}
            </Link>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="truncate max-w-xs text-slate-800 font-medium">
              {deal.title}
            </span>
          </nav>

          {/* Expired warning if viewed directly */}
          {isExpired && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 shadow-xs">
              <span className="font-semibold text-amber-800">Notice:</span> This promotional deal is past its expiration date or marked expired. Pricing or availability on the merchant site may no longer apply.
            </div>
          )}

          {/* Main Deal Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Column (Left, 7 cols) */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200/80">
                {deal.image ? (
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain p-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-8 text-slate-400">
                    <ShoppingBag className="h-16 w-16 stroke-1 text-slate-400" />
                    <span className="mt-3 text-sm font-medium text-slate-600">
                      {deal.source_name} Listing
                    </span>
                  </div>
                )}

                {deal.percentage_off && deal.percentage_off > 0 && (
                  <div className="absolute top-4 left-4 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs">
                    -{deal.percentage_off}% Discount
                  </div>
                )}
              </div>

              {/* Deal Overview details */}
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Deal Overview
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {deal.short_description}
                </p>

                <div className="mt-6 border-t border-slate-100 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Retailer / Source</span>
                    <span className="font-semibold text-slate-800">{deal.source_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Category</span>
                    <span className="font-semibold text-slate-800">{deal.category?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Posted Date</span>
                    <span suppressHydrationWarning className="font-semibold text-slate-800">
                      {formatUtcDateWithYear(deal.posted_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module (Right, 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
                {/* Quiet metadata line */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{deal.source_name}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{deal.category?.name}</span>
                  {deal.status === 'live' ? (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-emerald-700 font-semibold">Verified Active</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500 capitalize">{deal.status}</span>
                    </>
                  )}
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                  {deal.title}
                </h1>

                {/* Price calculation block */}
                <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-200">
                  <div className="flex items-baseline gap-3">
                    {deal.discounted_price !== null && deal.discounted_price !== undefined ? (
                      <>
                        <span className="font-mono text-3xl font-extrabold tabular-nums text-emerald-700">
                          {formatNaira(deal.discounted_price)}
                        </span>
                        {deal.original_price && (
                          <span className="font-mono text-base tabular-nums text-slate-400 line-through">
                            {formatNaira(deal.original_price)}
                          </span>
                        )}
                      </>
                    ) : deal.original_price !== null && deal.original_price !== undefined ? (
                      <span className="font-mono text-2xl font-extrabold tabular-nums text-emerald-700">
                        {formatNaira(deal.original_price)}
                      </span>
                    ) : (
                      <span className="text-base font-semibold text-emerald-700 flex items-center gap-1.5">
                        <Tag className="h-4 w-4" /> Promotional Discount
                      </span>
                    )}
                  </div>

                  {nairaSavings && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      You save {nairaSavings} ({deal.percentage_off}% off regular retail)
                    </p>
                  )}

                  {deal.free_shipping && (
                    <p className="mt-2 text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Free Shipping eligible with this merchant order
                    </p>
                  )}

                  {deal.coupon_code && (
                    <div className="mt-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/80 p-3 text-xs">
                      <div className="font-semibold text-emerald-900">
                        Promo Coupon Code:
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <code className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300 select-all shadow-2xs">
                          {deal.coupon_code}
                        </code>
                        <span className="text-[11px] text-slate-500">
                          Copy & paste during merchant checkout
                        </span>
                      </div>
                    </div>
                  )}

                  {deal.expires_at && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-200 pt-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span suppressHydrationWarning>
                        Offer valid until {formatUtcDate(deal.expires_at)}
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-98"
                  >
                    <span>Get deal at {deal.source_name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <p className="text-center text-xs text-slate-500">
                    Links directly to retailer checkout. DealPulse does not sell or process payments.
                  </p>
                </div>

                {/* Guarantee & Outbound transparency */}
                <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Verified outbound link directed to the official merchant domain.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Deals in this Category */}
          {relatedDeals.length > 0 && (
            <div className="mt-16 border-t border-slate-200/80 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  More in {deal.category?.name}
                </h2>
                <Link
                  href={`/?category=${deal.category?.slug}`}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>View all</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
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
