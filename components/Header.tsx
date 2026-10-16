'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ShieldCheck } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single element brand wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow-xs shadow-emerald-500/20">
            <Zap className="h-4 w-4 fill-slate-950 text-slate-950" />
          </span>
          <span className="text-white">DealPulse</span>
        </Link>

        {/* Zone 2: 4–5 concise single-line nav links */}
        <nav className="hidden items-center gap-7 md:flex text-xs font-semibold text-slate-400">
          <Link
            href="/"
            className={`transition-colors hover:text-emerald-400 whitespace-nowrap shrink-0 ${
              pathname === '/' ? 'text-white' : ''
            }`}
          >
            Live Feed
          </Link>
          <Link
            href="/?category=electronics"
            className="transition-colors hover:text-emerald-400 whitespace-nowrap shrink-0"
          >
            Electronics
          </Link>
          <Link
            href="/?category=audio"
            className="transition-colors hover:text-emerald-400 whitespace-nowrap shrink-0"
          >
            Audio
          </Link>
          <Link
            href="/?category=gaming"
            className="transition-colors hover:text-emerald-400 whitespace-nowrap shrink-0"
          >
            Gaming
          </Link>
          <Link
            href="/?category=home-kitchen"
            className="transition-colors hover:text-emerald-400 whitespace-nowrap shrink-0"
          >
            Home
          </Link>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin ? (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white whitespace-nowrap"
            >
              Public Feed
            </Link>
          ) : (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-500/50 hover:bg-slate-800 hover:text-white whitespace-nowrap shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
