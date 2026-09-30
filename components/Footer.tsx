import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50/50 py-12 text-neutral-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-base font-bold text-neutral-900">
              DealPulse
            </div>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              A curated deals discovery platform presenting short promotional snippets with verified outbound links. We do not process transactions or handle payments directly on the platform.
            </p>
            <p className="mt-3 text-xs text-neutral-400">
              Prices and merchant availability are subject to change by the originating retailers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Browse Categories
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/?category=electronics" className="hover:text-neutral-900 transition-colors">
                  Electronics & Tech
                </Link>
              </li>
              <li>
                <Link href="/?category=audio" className="hover:text-neutral-900 transition-colors">
                  Audio & Headphones
                </Link>
              </li>
              <li>
                <Link href="/?category=gaming" className="hover:text-neutral-900 transition-colors">
                  PC & Console Gaming
                </Link>
              </li>
              <li>
                <Link href="/?category=home-kitchen" className="hover:text-neutral-900 transition-colors">
                  Home & Kitchen
                </Link>
              </li>
              <li>
                <Link href="/?category=fashion" className="hover:text-neutral-900 transition-colors">
                  Fashion & Apparel
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Platform & Tools
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/admin" className="hover:text-neutral-900 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-neutral-900 transition-colors">
                  Admin Sign In
                </Link>
              </li>
              <li>
                <a
                  href="/api/tests"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
                >
                  <span>API Test Suite (JSON)</span>
                </a>
              </li>
              <li>
                <a
                  href="/api/deals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
                >
                  <span>Deals Feed Endpoint</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} DealPulse. All third-party trademarks belong to their respective owners.</p>
          <div className="flex items-center gap-4">
            <span className="text-neutral-500">Built with Django REST + Next.js App Router</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
