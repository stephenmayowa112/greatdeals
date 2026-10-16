import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/90 bg-white py-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white font-black">
                <Zap className="h-3.5 w-3.5 fill-white text-white" />
              </span>
              <span>DealPulse</span>
            </div>
            <p className="mt-3 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
              A curated deals discovery platform presenting short promotional snippets with verified outbound links. We do not process transactions or handle payments directly on the platform.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Prices and merchant availability are subject to change by the originating retailers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Browse Categories
            </h4>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-600">
              <li>
                <Link
                  href="/?category=electronics"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Electronics & Tech
                </Link>
              </li>
              <li>
                <Link
                  href="/?category=audio"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Audio & Headphones
                </Link>
              </li>
              <li>
                <Link
                  href="/?category=gaming"
                  className="hover:text-emerald-700 transition-colors"
                >
                  PC & Console Gaming
                </Link>
              </li>
              <li>
                <Link
                  href="/?category=home-kitchen"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Home & Kitchen
                </Link>
              </li>
              <li>
                <Link
                  href="/?category=fashion"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Fashion & Apparel
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform & Tools
            </h4>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-600">
              <li>
                <Link
                  href="/admin"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Admin Console
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="hover:text-emerald-700 transition-colors"
                >
                  Admin Sign In
                </Link>
              </li>
              <li>
                <a
                  href="/api/tests"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>API Test Suite (JSON)</span>
                </a>
              </li>
              <li>
                <a
                  href="/api/deals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>Deals Feed Endpoint</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} DealPulse. All third-party trademarks belong to their respective owners.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Curated Outbound Deals Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
