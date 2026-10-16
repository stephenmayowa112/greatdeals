'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ExternalLink,
  Tag,
  Clock,
  Share2,
  Check,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Truck,
  Copy,
  ChevronRight,
  Store,
  Sparkles,
} from 'lucide-react';
import { Deal } from '@/lib/types';
import { formatNaira, formatUtcDate } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
}

function getInitialScore(deal: Deal): number {
  if (typeof deal.score === 'number') return deal.score;
  let hash = 0;
  for (let i = 0; i < deal.id.length; i++) {
    hash = (hash + deal.id.charCodeAt(i) * 7) % 35;
  }
  return 15 + hash;
}

export default function DealCard({ deal }: DealCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState<number>(() => getInitialScore(deal));

  const postedDate = React.useMemo(() => {
    return formatUtcDate(deal.posted_at) || 'Recent';
  }, [deal.posted_at]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dealUrl = `${window.location.origin}/deals/${deal.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(dealUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deal.coupon_code && navigator.clipboard) {
      await navigator.clipboard.writeText(deal.coupon_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleVote = (type: 'up' | 'down', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (vote === type) {
      // Toggle off
      setVote(null);
      setScore((prev) => (type === 'up' ? prev - 1 : prev + 1));
    } else {
      const delta = vote === null ? (type === 'up' ? 1 : -1) : type === 'up' ? 2 : -2;
      setVote(type);
      setScore((prev) => prev + delta);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  const savingsAmount =
    deal.original_price && deal.discounted_price && deal.original_price > deal.discounted_price
      ? deal.original_price - deal.discounted_price
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-200 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-slate-200/60">
      {/* 1. Header Bar: Store Name, Post Time, Community Score & Bookmark */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-emerald-700 hover:underline">
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>{deal.source_name} Deals</span>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            suppressHydrationWarning
            className="flex items-center gap-1 text-slate-500"
          >
            <Clock className="h-3 w-3 text-slate-400" />
            {postedDate}
          </span>
        </div>

        {/* Community Score / Voting & Bookmark */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono shadow-2xs">
            <button
              onClick={(e) => handleVote('up', e)}
              className={`p-0.5 transition-colors ${
                vote === 'up'
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-400 hover:text-emerald-600'
              }`}
              title="Helpful deal (Upvote)"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <span
              className={`mx-1.5 font-bold tabular-nums ${
                score > 0 ? 'text-emerald-700' : score < 0 ? 'text-rose-600' : 'text-slate-600'
              }`}
            >
              +{score}
            </span>
            <button
              onClick={(e) => handleVote('down', e)}
              className={`p-0.5 transition-colors ${
                vote === 'down'
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-400 hover:text-rose-600'
              }`}
              title="Not working (Downvote)"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={handleBookmark}
            title={bookmarked ? 'Saved to bookmarks' : 'Bookmark this deal'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              bookmarked
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Horizontal Body: Left Image Showcase + Right Details */}
      <div className="flex flex-col md:flex-row items-stretch gap-5 p-4 sm:p-5">
        {/* Left Column: Product Image Thumbnail with framing */}
        <Link
          href={`/deals/${deal.id}`}
          className="relative block h-52 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white md:h-52 md:w-56 shadow-2xs"
        >
          {deal.image && !imageError ? (
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              sizes="(max-width: 768px) 100vw, 240px"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-103"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-slate-400">
              <ShoppingBag className="h-10 w-10 stroke-1 text-slate-400" />
              <span className="mt-2 text-xs font-medium text-slate-600">
                {deal.category?.name || 'Verified Offer'}
              </span>
            </div>
          )}

          {/* Discount Tag Overlay */}
          {deal.percentage_off && deal.percentage_off > 0 ? (
            <div className="absolute top-2.5 left-2.5 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
              -{deal.percentage_off}% OFF
            </div>
          ) : null}

          {/* Free Shipping Tag Overlay */}
          {deal.free_shipping && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-white/95 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs">
              <Truck className="h-2.5 w-2.5" />
              <span>FREE SHIP</span>
            </div>
          )}
        </Link>

        {/* Right Column: Title, Price Breakdown, Promo Code, Specs */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            {/* Headline with price callout (DealsOfAmerica pattern) */}
            <h3 className="text-base sm:text-lg font-bold leading-snug text-slate-900 group-hover:text-emerald-700 transition-colors">
              <Link href={`/deals/${deal.id}`} className="hover:underline underline-offset-2">
                {deal.discounted_price ? (
                  <span className="font-mono text-emerald-700 mr-2 font-extrabold">
                    {formatNaira(deal.discounted_price)}
                  </span>
                ) : deal.original_price ? (
                  <span className="font-mono text-emerald-700 mr-2 font-extrabold">
                    {formatNaira(deal.original_price)}
                  </span>
                ) : null}
                <span>{deal.title}</span>
              </Link>
            </h3>

            {/* Price & Savings Summary Bar */}
            <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5 text-xs sm:text-sm">
              {deal.discounted_price !== null && deal.discounted_price !== undefined ? (
                <>
                  <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-emerald-700">
                    {formatNaira(deal.discounted_price)}
                  </span>
                  {deal.original_price && (
                    <span className="font-mono text-xs tabular-nums text-slate-400 line-through">
                      Reg: {formatNaira(deal.original_price)}
                    </span>
                  )}
                  {savingsAmount && (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Save {formatNaira(savingsAmount)} ({deal.percentage_off}% off)
                    </span>
                  )}
                </>
              ) : deal.original_price !== null && deal.original_price !== undefined ? (
                <span className="font-mono text-xl font-bold tabular-nums text-emerald-700">
                  {formatNaira(deal.original_price)}
                </span>
              ) : null}

              {deal.free_shipping && (
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Free Shipping</span>
                </span>
              )}
            </div>

            {/* Description / Deal Breakdown Paragraph */}
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 md:line-clamp-3">
              {deal.short_description}
            </p>

            {/* Coupon Code / Promo Box (DealsOfAmerica hallmark) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 p-2.5 text-xs">
              {deal.coupon_code ? (
                <>
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    Coupon Code:
                  </span>
                  <code className="font-mono font-bold tracking-wider rounded-md border border-slate-300 bg-white px-2.5 py-1 text-slate-900 select-all shadow-2xs">
                    {deal.coupon_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
                    Apply at checkout on {deal.source_name}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Direct Retailer Discount — No coupon code required at checkout.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Meta Info (Category + Expiration) */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-500">
              Category: <span className="text-slate-800 font-semibold">{deal.category?.name || 'General'}</span>
            </span>
            {deal.expires_at && (
              <span
                suppressHydrationWarning
                className="font-mono text-slate-500 text-[11px]"
              >
                Expires: {formatUtcDate(deal.expires_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Outbound Action & Share Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 sm:px-5 py-3">
        {/* Left Footer Utilities */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href={`/deals/${deal.id}`}
            className="font-medium text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
          >
            <span>View Details & Discussion</span>
            <ChevronRight className="h-3 w-3" />
          </Link>

          <span aria-hidden="true" className="text-slate-300">
            |
          </span>

          {/* Share Button with instant link copy */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
            title="Share this deal"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Right Primary Outbound CTA: DealsOfAmerica "Shop Now" / "Get Deal" */}
        <a
          href={deal.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-98"
        >
          <span>Shop Now at {deal.source_name}</span>
          <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
        </a>
      </div>
    </article>
  );
}
