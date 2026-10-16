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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0F172A]/85 backdrop-blur-md transition-all duration-200 hover:border-emerald-500/40 hover:bg-[#121B32] hover:shadow-xl hover:shadow-emerald-950/15">
      {/* 1. Header Bar: Store Name, Post Time, Community Score & Bookmark */}
      <div className="flex items-center justify-between border-b border-slate-800/70 bg-slate-950/40 px-4 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Store className="h-3.5 w-3.5 text-emerald-400" />
            <span>{deal.source_name} Deals</span>
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span
            suppressHydrationWarning
            className="flex items-center gap-1 text-slate-400"
          >
            <Clock className="h-3 w-3 text-slate-500" />
            {postedDate}
          </span>
        </div>

        {/* Community Score / Voting & Bookmark */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-xs font-mono">
            <button
              onClick={(e) => handleVote('up', e)}
              className={`p-0.5 transition-colors ${
                vote === 'up'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              title="Helpful deal (Upvote)"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <span
              className={`mx-1.5 font-bold ${
                score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              +{score}
            </span>
            <button
              onClick={(e) => handleVote('down', e)}
              className={`p-0.5 transition-colors ${
                vote === 'down'
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-400 hover:text-rose-400'
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
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Main Horizontal Body: Left Image Showcase + Right Details */}
      <div className="flex flex-col md:flex-row items-stretch gap-5 p-4 sm:p-5">
        {/* Left Column: Product Image Thumbnail with framing */}
        <Link
          href={`/deals/${deal.id}`}
          className="relative block h-52 w-full shrink-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/90 md:h-52 md:w-56"
        >
          {deal.image && !imageError ? (
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              sizes="(max-width: 768px) 100vw, 240px"
              className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-103"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 p-6 text-slate-500">
              <ShoppingBag className="h-10 w-10 stroke-1 text-slate-600" />
              <span className="mt-2 text-xs font-medium text-slate-400">
                {deal.category?.name || 'Verified Offer'}
              </span>
            </div>
          )}

          {/* Discount Tag Overlay */}
          {deal.percentage_off && deal.percentage_off > 0 ? (
            <div className="absolute top-2.5 left-2.5 rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-slate-950 shadow-md">
              -{deal.percentage_off}% OFF
            </div>
          ) : null}

          {/* Free Shipping Tag Overlay */}
          {deal.free_shipping && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-slate-950/85 border border-slate-700/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 shadow-sm">
              <Truck className="h-2.5 w-2.5" />
              <span>FREE SHIP</span>
            </div>
          )}
        </Link>

        {/* Right Column: Title, Price Breakdown, Promo Code, Specs */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            {/* Headline with price callout (DealsOfAmerica pattern) */}
            <h3 className="text-base sm:text-lg font-bold leading-snug text-white group-hover:text-emerald-300 transition-colors">
              <Link href={`/deals/${deal.id}`} className="hover:underline underline-offset-2">
                {deal.discounted_price ? (
                  <span className="font-mono text-emerald-400 mr-2 font-extrabold">
                    {formatNaira(deal.discounted_price)}
                  </span>
                ) : deal.original_price ? (
                  <span className="font-mono text-emerald-400 mr-2 font-extrabold">
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
                  <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-emerald-400">
                    {formatNaira(deal.discounted_price)}
                  </span>
                  {deal.original_price && (
                    <span className="font-mono text-xs tabular-nums text-slate-500 line-through">
                      Reg: {formatNaira(deal.original_price)}
                    </span>
                  )}
                  {savingsAmount && (
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                      Save {formatNaira(savingsAmount)} ({deal.percentage_off}% off)
                    </span>
                  )}
                </>
              ) : deal.original_price !== null && deal.original_price !== undefined ? (
                <span className="font-mono text-xl font-bold tabular-nums text-emerald-400">
                  {formatNaira(deal.original_price)}
                </span>
              ) : null}

              {deal.free_shipping && (
                <span className="ml-auto flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Truck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Free Shipping</span>
                </span>
              )}
            </div>

            {/* Description / Deal Breakdown Paragraph */}
            <p className="mt-2.5 text-xs sm:text-sm text-slate-300/90 leading-relaxed line-clamp-2 md:line-clamp-3">
              {deal.short_description}
            </p>

            {/* Coupon Code / Promo Box (DealsOfAmerica hallmark) */}
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/60 p-2.5 text-xs">
              {deal.coupon_code ? (
                <>
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-400" />
                    Coupon Code:
                  </span>
                  <code className="font-mono font-bold tracking-wider rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-emerald-300 select-all">
                    {deal.coupon_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                    Apply at checkout on {deal.source_name}
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Direct Retailer Discount — No coupon code required at checkout.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Meta Info (Category + Expiration) */}
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
            <span className="font-medium text-slate-400">
              Category: <span className="text-slate-200">{deal.category?.name || 'General'}</span>
            </span>
            {deal.expires_at && (
              <span
                suppressHydrationWarning
                className="font-mono text-slate-400 text-[11px]"
              >
                Expires: {formatUtcDate(deal.expires_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Outbound Action & Share Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/50 px-4 sm:px-5 py-3">
        {/* Left Footer Utilities */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href={`/deals/${deal.id}`}
            className="font-medium text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <span>View Details & Discussion</span>
            <ChevronRight className="h-3 w-3" />
          </Link>

          <span aria-hidden="true" className="text-slate-700">
            |
          </span>

          {/* Share Button with instant link copy */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Share this deal"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Link Copied!</span>
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400 active:scale-98"
        >
          <span>Shop Now at {deal.source_name}</span>
          <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
        </a>
      </div>
    </article>
  );
}
