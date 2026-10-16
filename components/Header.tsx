'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black shadow-xs shadow-emerald-600/20">
            <Zap className="h-4 w-4 fill-white text-white" />
          </span>
          <span className="text-slate-900">DealPulse</span>
        </Link>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden items-center gap-7 md:flex text-xs font-semibold text-slate-600">
          <Link
            href="/"
            className={`transition-colors hover:text-emerald-700 whitespace-nowrap shrink-0 ${
              pathname === '/' ? 'text-emerald-700 font-bold' : ''
            }`}
          >
            Live Feed
          </Link>
          <Link
            href="/?category=electronics"
            className="transition-colors hover:text-emerald-700 whitespace-nowrap shrink-0"
          >
            Electronics
          </Link>
          <Link
            href="/?category=audio"
            className="transition-colors hover:text-emerald-700 whitespace-nowrap shrink-0"
          >
            Audio
          </Link>
          <Link
            href="/?category=gaming"
            className="transition-colors hover:text-emerald-700 whitespace-nowrap shrink-0"
          >
            Gaming
          </Link>
          <Link
            href="/?category=home-kitchen"
            className="transition-colors hover:text-emerald-700 whitespace-nowrap shrink-0"
          >
            Home
          </Link>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin ? (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 whitespace-nowrap shadow-2xs"
            >
              Public Feed
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50 hover:text-emerald-800 whitespace-nowrap shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
