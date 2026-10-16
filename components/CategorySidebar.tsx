'use client';

import React from 'react';
import { Category } from '@/lib/types';
import {
  Tag,
  Laptop,
  Headphones,
  Gamepad2,
  Home,
  Shirt,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Store,
  CheckCircle2,
} from 'lucide-react';

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  totalDealsCount: number;
  activeStore?: string;
  onSelectStore?: (store: string) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'electronics':
      return <Laptop className="h-4 w-4" />;
    case 'audio':
      return <Headphones className="h-4 w-4" />;
    case 'gaming':
      return <Gamepad2 className="h-4 w-4" />;
    case 'home-kitchen':
      return <Home className="h-4 w-4" />;
    case 'fashion':
      return <Shirt className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
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

export default function CategorySidebar({
  categories,
  activeCategory,
  onSelectCategory,
  totalDealsCount,
  activeStore = 'all',
  onSelectStore,
  onResetFilters,
  isFiltered = false,
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5">
      {/* Categories Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Categories
            </span>
          </div>

          {isFiltered && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Category Navigation Items */}
        <nav className="mt-3 space-y-1">
          {/* All Deals */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/90 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles
                className={`h-4 w-4 ${
                  activeCategory === 'all' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>All Deals</span>
            </div>
            <span
              className={`font-mono text-[11px] tabular-nums px-2 py-0.5 rounded-md ${
                activeCategory === 'all'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalDealsCount}
            </span>
          </button>

          {/* Individual Categories */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/90 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {getCategoryIcon(cat.slug)}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </div>
                {cat.dealCount !== undefined && (
                  <span
                    className={`font-mono text-[11px] tabular-nums px-2 py-0.5 rounded-md shrink-0 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.dealCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Top Stores Module (DealsOfAmerica pattern) */}
      {onSelectStore && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
            <Store className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Popular Stores
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {POPULAR_STORES.map((store) => {
              const isActive = activeStore.toLowerCase() === store.slug.toLowerCase();
              return (
                <button
                  key={store.slug}
                  onClick={() => onSelectStore(store.slug)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {store.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Outbound Guarantee Notice */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-4 text-slate-600">
        <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>100% Direct Outbound Links</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          No markups, coupons automatically verified, and zero checkout required on DealPulse. Click any deal to redeem directly at the official merchant.
        </p>
      </div>
    </aside>
  );
}
