'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900 transition-colors hover:text-neutral-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>DealPulse</span>
          </Link>
          <span className="hidden text-xs text-neutral-400 sm:inline" aria-hidden="true">
            /
          </span>
          <span className="hidden text-xs font-medium text-neutral-500 sm:inline">
            Curated Outbound Deals
          </span>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden items-center gap-6 md:flex text-sm font-medium text-neutral-600">
          <Link
            href="/"
            className={`transition-colors hover:text-neutral-900 ${
              pathname === '/' ? 'text-neutral-900 font-semibold' : ''
            }`}
          >
            Live Feed
          </Link>
          <Link
            href="/?category=electronics"
            className="transition-colors hover:text-neutral-900"
          >
            Electronics
          </Link>
          <Link
            href="/?category=audio"
            className="transition-colors hover:text-neutral-900"
          >
            Audio
          </Link>
          <Link
            href="/?category=gaming"
            className="transition-colors hover:text-neutral-900"
          >
            Gaming
          </Link>
          <Link
            href="/?category=home-kitchen"
            className="transition-colors hover:text-neutral-900"
          >
            Home
          </Link>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              Back to Public Feed
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
