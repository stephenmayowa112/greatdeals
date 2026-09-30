'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Deal, Category, PaginatedDealsResponse } from '@/lib/types';
import DealCard from './DealCard';

interface DealFeedProps {
  initialDeals: Deal[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialTotal: number;
  categories: Category[];
  initialCategory?: string;
  initialQuery?: string;
}

export default function DealFeed({
  initialDeals,
  initialCursor,
  initialHasMore,
  initialTotal,
  categories,
  initialCategory = 'all',
  initialQuery = '',
}: DealFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active filter states
  const activeCategory = searchParams.get('category') || initialCategory || 'all';
  const activeQuery = searchParams.get('q') || initialQuery || '';

  const [searchInput, setSearchInput] = useState(activeQuery);
  const [prevQuery, setPrevQuery] = useState(activeQuery);

  // Sync search input if active query changes in URL
  if (prevQuery !== activeQuery) {
    setPrevQuery(activeQuery);
    setSearchInput(activeQuery);
  }

  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [totalMatching, setTotalMatching] = useState<number>(initialTotal);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Update URL parameters
  const updateFilters = useCallback(
    (newCategory: string, newQuery: string) => {
      const params = new URLSearchParams();
      if (newCategory && newCategory !== 'all') {
        params.set('category', newCategory);
      }
      if (newQuery && newQuery.trim()) {
        params.set('q', newQuery.trim());
      }
      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
    },
    [router]
  );

  // Fetch deals on filter change
  const fetchFilteredDeals = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (activeQuery && activeQuery.trim()) {
        params.set('q', activeQuery.trim());
      }
      params.set('limit', '8');

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load deals');
      const data: PaginatedDealsResponse = await res.json();

      setDeals(data.items);
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
      setTotalMatching(data.total_matching);
    } catch (err: any) {
      setError(err?.message || 'Error loading deals');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeQuery]);

  // When filters change in URL, trigger re-fetch asynchronously
  useEffect(() => {
    let active = true;
    const isInitialMatch =
      activeCategory === (initialCategory || 'all') &&
      activeQuery === (initialQuery || '') &&
      deals.length === initialDeals.length;

    if (!isInitialMatch) {
      const loadAsync = async () => {
        try {
          const params = new URLSearchParams();
          if (activeCategory && activeCategory !== 'all') {
            params.set('category', activeCategory);
          }
          if (activeQuery && activeQuery.trim()) {
            params.set('q', activeQuery.trim());
          }
          params.set('limit', '8');

          const res = await fetch(`/api/deals?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to load deals');
          const data: PaginatedDealsResponse = await res.json();

          if (active) {
            setDeals(data.items);
            setCursor(data.next_cursor);
            setHasMore(data.has_more);
            setTotalMatching(data.total_matching);
            setIsLoading(false);
          }
        } catch (err: any) {
          if (active) {
            setError(err?.message || 'Error loading deals');
            setIsLoading(false);
          }
        }
      };

      loadAsync();
    }

    return () => {
      active = false;
    };
  }, [activeCategory, activeQuery, initialCategory, initialQuery, initialDeals.length, deals.length]);

  // Load next page via cursor
  const loadMoreDeals = useCallback(async () => {
    if (!cursor || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (activeQuery && activeQuery.trim()) {
        params.set('q', activeQuery.trim());
      }
      params.set('cursor', cursor);
      params.set('limit', '8');

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load more deals');
      const data: PaginatedDealsResponse = await res.json();

      // Deduplicate items just in case
      setDeals((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const newItems = data.items.filter((d) => !existingIds.has(d.id));
        return [...prev, ...newItems];
      });

      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err: any) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore, hasMore, activeCategory, activeQuery]);

  // Infinite scroll intersection observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreDeals();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMoreDeals]);

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(activeCategory, searchInput);
  };

  const handleCategorySelect = (categorySlug: string) => {
    updateFilters(categorySlug, activeQuery);
  };

  const clearFilters = () => {
    setSearchInput('');
    router.push('/');
  };

  return (
    <div className="w-full">
      {/* Search & Filter Header Toolbar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search deals by product, retailer, or keyword..."
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilters(activeCategory, '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Feed count & refresh */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="font-semibold text-neutral-900">{totalMatching}</span>
              <span>{totalMatching === 1 ? 'deal live' : 'deals live'}</span>
            </div>
            <button
              onClick={() => fetchFilteredDeals()}
              disabled={isLoading}
              title="Refresh feed"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Category Tabs (Segmented controls) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-neutral-100/90 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/90 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                }`}
              >
                <span>{cat.name}</span>
                {cat.dealCount !== undefined && cat.dealCount > 0 && (
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      isSelected ? 'text-neutral-300' : 'text-neutral-400'
                    }`}
                  >
                    {cat.dealCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchFilteredDeals()}
            className="text-xs font-semibold underline underline-offset-2 hover:text-red-950"
          >
            Try again
          </button>
        </div>
      )}

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="aspect-4/3 w-full rounded-lg bg-neutral-200" />
              <div className="mt-4 h-3 w-1/3 rounded bg-neutral-200" />
              <div className="mt-2 h-4 w-3/4 rounded bg-neutral-200" />
              <div className="mt-2 h-3 w-full rounded bg-neutral-200" />
              <div className="mt-4 flex justify-between items-center">
                <div className="h-5 w-16 rounded bg-neutral-200" />
                <div className="h-7 w-20 rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      ) : deals.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
          <SlidersHorizontal className="mx-auto h-10 w-10 text-neutral-300" />
          <h3 className="mt-3 text-base font-semibold text-neutral-900">No active deals found</h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            {activeQuery || activeCategory !== 'all'
              ? 'No deals match your current search or category filters. Try clearing filters or searching for another brand or product.'
              : 'There are currently no live deals in the system.'}
          </p>
          {(activeQuery || activeCategory !== 'all') && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {/* Infinite Scroll Trigger & Bottom Sentinel */}
      <div ref={observerTarget} className="mt-12 flex flex-col items-center justify-center py-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-800" />
            <span>Loading more deals...</span>
          </div>
        )}

        {!isLoading && !isLoadingMore && hasMore && (
          <button
            onClick={loadMoreDeals}
            className="rounded-lg border border-neutral-300 bg-white px-5 py-2 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-colors"
          >
            Load more deals
          </button>
        )}

        {!hasMore && deals.length > 0 && !isLoading && (
          <p className="text-xs text-neutral-400">
            You’ve reached the end of current live deals.
          </p>
        )}
      </div>
    </div>
  );
}
