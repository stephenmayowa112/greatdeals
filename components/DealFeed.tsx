'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Sparkles,
  RefreshCw,
  ArrowUpDown,
  Laptop,
  Headphones,
  Gamepad2,
  Home,
  Shirt,
  Tag,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { Deal, Category, PaginatedDealsResponse } from '@/lib/types';
import DealCard from './DealCard';
import CategorySidebar from './CategorySidebar';

interface DealFeedProps {
  initialDeals: Deal[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialTotal: number;
  categories: Category[];
  initialCategory?: string;
  initialQuery?: string;
}

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'electronics':
      return <Laptop className="h-3.5 w-3.5" />;
    case 'audio':
      return <Headphones className="h-3.5 w-3.5" />;
    case 'gaming':
      return <Gamepad2 className="h-3.5 w-3.5" />;
    case 'home-kitchen':
      return <Home className="h-3.5 w-3.5" />;
    case 'fashion':
      return <Shirt className="h-3.5 w-3.5" />;
    default:
      return <Tag className="h-3.5 w-3.5" />;
  }
};

const POPULAR_STORES = [
  { name: 'All Stores', slug: 'all' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'Best Buy', slug: 'best buy' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Nike', slug: 'nike' },
  { name: 'B&H Photo', slug: 'b&h' },
  { name: 'Target', slug: 'target' },
];

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

  // Active filter states from URL
  const activeCategory = searchParams.get('category') || initialCategory || 'all';
  const activeStore = searchParams.get('store') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';
  const activeQuery = searchParams.get('q') || initialQuery || '';

  const [searchInput, setSearchInput] = useState(activeQuery);
  const [prevQuery, setPrevQuery] = useState(activeQuery);

  // Sync state if query in URL changed
  if (prevQuery !== activeQuery) {
    setPrevQuery(activeQuery);
    setSearchInput(activeQuery);
  }

  // View mode: default to DealsOfAmerica single-column list
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [totalMatching, setTotalMatching] = useState<number>(initialTotal);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Update URL parameters without triggering full page reloads
  const updateFilters = useCallback(
    (newCategory: string, newStore: string, newSort: string, newQuery: string) => {
      const params = new URLSearchParams();
      if (newCategory && newCategory !== 'all') {
        params.set('category', newCategory);
      }
      if (newStore && newStore !== 'all') {
        params.set('store', newStore);
      }
      if (newSort && newSort !== 'newest') {
        params.set('sort', newSort);
      }
      if (newQuery && newQuery.trim()) {
        params.set('q', newQuery.trim());
      }
      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
    },
    [router]
  );

  // Fetch deals whenever category, store, sort, or query changes
  const fetchFilteredDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (activeStore && activeStore !== 'all') {
        params.set('store', activeStore);
      }
      if (activeSort && activeSort !== 'newest') {
        params.set('sort', activeSort);
      }
      if (activeQuery) {
        params.set('q', activeQuery);
      }
      params.set('limit', '8');

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load deals feed');
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
  }, [activeCategory, activeStore, activeSort, activeQuery]);

  // Refetch when filters change after mount
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchFilteredDeals();
  }, [fetchFilteredDeals]);

  // Load More logic for infinite scrolling
  const loadMoreDeals = useCallback(async () => {
    if (!cursor || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (activeStore && activeStore !== 'all') {
        params.set('store', activeStore);
      }
      if (activeSort && activeSort !== 'newest') {
        params.set('sort', activeSort);
      }
      if (activeQuery) {
        params.set('q', activeQuery);
      }
      params.set('cursor', cursor);
      params.set('limit', '8');

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load next page');
      const data: PaginatedDealsResponse = await res.json();

      setDeals((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const uniqueNew = data.items.filter((d) => !existingIds.has(d.id));
        return [...prev, ...uniqueNew];
      });
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
      setTotalMatching(data.total_matching);
    } catch (err: any) {
      console.error('Error fetching more deals:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, isLoadingMore, hasMore, activeCategory, activeStore, activeSort, activeQuery]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreDeals();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadMoreDeals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(activeCategory, activeStore, activeSort, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilters(activeCategory, activeStore, activeSort, '');
  };

  const handleCategoryClick = (slug: string) => {
    updateFilters(slug, activeStore, activeSort, activeQuery);
  };

  const handleStoreClick = (store: string) => {
    updateFilters(activeCategory, store, activeSort, activeQuery);
  };

  const handleSortChange = (newSort: string) => {
    updateFilters(activeCategory, activeStore, newSort, activeQuery);
  };

  const handleResetAll = () => {
    setSearchInput('');
    updateFilters('all', 'all', 'newest', '');
  };

  const isFiltered =
    activeCategory !== 'all' || activeStore !== 'all' || activeSort !== 'newest' || !!activeQuery;
  const activeCategoryObj = categories.find((c) => c.slug === activeCategory);

  return (
    <div className="space-y-6">
      {/* 1. DealsOfAmerica Discovery Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs">
        {/* Instant Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search deals, products, stores, or coupons..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 shadow-inner"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Sort & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 text-xs">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700">
            <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600" />
            <select
              value={activeSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="newest" className="bg-white text-slate-800">
                Newest Deals First
              </option>
              <option value="popular" className="bg-white text-slate-800">
                Most Popular (Votes)
              </option>
              <option value="discount" className="bg-white text-slate-800">
                Highest Discount %
              </option>
              <option value="price_asc" className="bg-white text-slate-800">
                Price: Low to High
              </option>
              <option value="price_desc" className="bg-white text-slate-800">
                Price: High to Low
              </option>
            </select>
          </div>

          {/* View Mode Toggle: List (DealsOfAmerica default) vs Grid */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="DealsOfAmerica Stream (Single Column List)"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Stream</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid Cards"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Deal Count */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
            <span className="font-bold text-emerald-700 tabular-nums">{totalMatching}</span>
            <span>deals</span>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Mobile Category Horizontal Bar (visible < lg) */}
      <div className="block lg:hidden space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>All Deals</span>
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span>{getCategoryIcon(cat.slug)}</span>
                <span>{cat.name}</span>
                {cat.dealCount !== undefined && (
                  <span
                    className={`ml-1 font-mono text-[10px] tabular-nums ${
                      isActive ? 'text-white/90' : 'text-slate-400'
                    }`}
                  >
                    ({cat.dealCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Store Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 shrink-0 font-medium pl-1">Stores:</span>
          {POPULAR_STORES.map((s) => {
            const isActive = activeStore.toLowerCase() === s.slug.toLowerCase();
            return (
              <button
                key={s.slug}
                onClick={() => handleStoreClick(s.slug)}
                className={`rounded-lg px-2 py-0.5 whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Two-Column Layout: Sidebar (desktop) + Vertical Deal Stream (DealsOfAmerica arrangement) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Desktop Category & Store Sidebar */}
        <div className="hidden lg:block">
          <CategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={handleCategoryClick}
            totalDealsCount={initialTotal}
            activeStore={activeStore}
            onSelectStore={handleStoreClick}
            onResetFilters={handleResetAll}
            isFiltered={isFiltered}
          />
        </div>

        {/* Deals Feed Container */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Active Filter Summary Banner */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-2xs">
              <span className="font-medium text-slate-500">Active filters:</span>
              {activeCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800 font-medium">
                  {activeCategoryObj?.name || activeCategory}
                  <button onClick={() => handleCategoryClick('all')} className="hover:text-emerald-950">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeStore !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800 font-medium">
                  Store: {activeStore}
                  <button onClick={() => handleStoreClick('all')} className="hover:text-emerald-950">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeSort !== 'newest' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700 font-medium">
                  Sort: {activeSort}
                  <button onClick={() => handleSortChange('newest')} className="hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeQuery && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-medium">
                  &ldquo;{activeQuery}&rdquo;
                  <button onClick={handleClearSearch} className="hover:text-slate-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Deals Feed: Single Column Horizontal Cards (DealsOfAmerica arrangement) or Grid */}
          {isLoading && deals.length === 0 ? (
            <div className="flex flex-col gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse flex flex-col md:flex-row gap-5"
                >
                  <div className="h-48 w-full md:w-56 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 w-3/4 rounded-sm bg-slate-200" />
                    <div className="h-6 w-1/3 rounded-sm bg-slate-200" />
                    <div className="h-4 w-full rounded-sm bg-slate-100" />
                    <div className="h-4 w-5/6 rounded-sm bg-slate-100" />
                    <div className="h-10 w-full rounded-xl bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-4">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No active deals found</h3>
              <p className="mt-1.5 max-w-sm text-xs text-slate-500 leading-relaxed">
                No matching discounts found with the current filters. Try resetting the category or search query.
              </p>
              <button
                onClick={handleResetAll}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Show All Deals</span>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* DealsOfAmerica Arrangement: Single-Column Stream of Horizontal Cards */
            <div className="flex flex-col gap-5">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            /* Optional Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs text-slate-700 shadow-xs">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading more deals...</span>
              </div>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={observerTarget} className="h-10 w-full" />

          {/* End of Feed / Manual Load fallback */}
          {!hasMore && deals.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-xs">
              <p className="text-xs text-slate-600">
                You&apos;ve reached the end of verified live deals ({deals.length} total).
              </p>
              <button
                onClick={handleResetAll}
                className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
              >
                Back to top & view all categories
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
