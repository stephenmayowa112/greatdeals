'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Tag, Clock, Share2, Check, ShoppingBag } from 'lucide-react';
import { Deal } from '@/lib/types';
import { formatNaira } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const postedDate = React.useMemo(() => {
    try {
      return new Date(deal.posted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }, [deal.posted_at]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dealUrl = `${window.location.origin}/deals/${deal.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(dealUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200/90 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-300">
      <div>
        {/* Visual Slot */}
        <Link href={`/deals/${deal.id}`} className="block relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
          {deal.image && !imageError ? (
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-103"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200/70 p-6 text-neutral-400">
              <ShoppingBag className="h-10 w-10 stroke-1 text-neutral-400" />
              <span className="mt-2 text-xs font-medium text-neutral-500">
                {deal.category?.name || 'Curated Offer'}
              </span>
            </div>
          )}

          {/* Discount Tag */}
          {deal.percentage_off && deal.percentage_off > 0 && (
            <div className="absolute top-3 left-3 rounded-md bg-neutral-900 px-2 py-1 text-xs font-bold text-white shadow-xs tracking-tight">
              -{deal.percentage_off}%
            </div>
          )}

          {/* Quick share button */}
          <button
            onClick={handleShare}
            aria-label="Share deal link"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-neutral-700 backdrop-blur-xs transition-colors hover:bg-white hover:text-neutral-900 shadow-xs"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          </button>
        </Link>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {/* Zero-Pill Metadata Line */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-800">{deal.source_name}</span>
            <span aria-hidden="true">·</span>
            <span>{deal.category?.name || 'Deals'}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3 inline text-neutral-400" />
              {postedDate}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-2 font-semibold text-base leading-snug text-neutral-900 line-clamp-2 transition-colors group-hover:text-neutral-700">
            <Link href={`/deals/${deal.id}`}>{deal.title}</Link>
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {deal.short_description}
          </p>

          {/* Price Block */}
          <div className="mt-4 flex items-baseline gap-2.5">
            {deal.discounted_price !== null && deal.discounted_price !== undefined ? (
              <>
                <span className="font-mono text-lg font-bold tabular-nums text-neutral-900">
                  {formatNaira(deal.discounted_price)}
                </span>
                {deal.original_price && (
                  <span className="font-mono text-xs tabular-nums text-neutral-400 line-through">
                    {formatNaira(deal.original_price)}
                  </span>
                )}
              </>
            ) : deal.original_price !== null && deal.original_price !== undefined ? (
              <span className="font-mono text-base font-semibold tabular-nums text-neutral-900">
                {formatNaira(deal.original_price)}
              </span>
            ) : (
              <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-neutral-500" /> Special Promo
              </span>
            )}

            {deal.expires_at && (
              <span className="ml-auto text-[11px] font-medium text-neutral-500 font-mono">
                Exp: {new Date(deal.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Outbound Action Footer */}
      <div className="border-t border-neutral-100 bg-neutral-50/50 p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
        <Link
          href={`/deals/${deal.id}`}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
        >
          View details
        </Link>

        {/* Primary CTA: Outbound to source retailer */}
        <a
          href={deal.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-neutral-800 active:scale-98 whitespace-nowrap"
        >
          <span>Get deal</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
