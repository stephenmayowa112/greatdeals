'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, KeyRound, AlertCircle, Zap, Check } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dealpulse.io');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated in local storage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('dealpulse_admin_token');
      if (storedToken) {
        // Quick verification
        fetch('/api/admin/auth', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated) {
              router.push('/admin');
            }
          })
          .catch(() => {});
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, [router]);

  const handleLoginSuccess = (token: string, user: any) => {
    try {
      localStorage.setItem('dealpulse_admin_token', token);
      localStorage.setItem('dealpulse_admin_user', JSON.stringify(user));
    } catch {
      // fallback
    }
    // Also set document cookie for immediate availability
    document.cookie = `admin_session=${token}; path=/; max-age=1209600; SameSite=None; Secure`;
    router.push('/admin');
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Authentication failed');
      }

      handleLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  const handleInstantLogin = () => {
    setEmail('admin@dealpulse.io');
    setPassword('admin123');
    executeLogin('admin@dealpulse.io', 'admin123');
  };

  const handleStephenLogin = () => {
    setEmail('stephenmayowa112@gmail.com');
    setPassword('admin123');
    executeLogin('stephenmayowa112@gmail.com', 'admin123');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to public deals feed</span>
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Admin Authentication</h1>
              <p className="text-xs text-neutral-500">DealPulse curation & management portal</p>
            </div>
          </div>

          {/* 1-Click Instant Demo Login CTA */}
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">
                  <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                  Instant One-Click Access
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Bypass manual input and log in directly as Administrator.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleInstantLogin}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>1-Click Instant Admin Login</span>
            </button>
          </div>

          {/* Quick Credential Presets */}
          <div className="mb-6 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 text-xs text-neutral-600">
            <div className="flex items-center justify-between font-semibold text-neutral-900 mb-1.5">
              <span>Quick-Fill Accounts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@dealpulse.io');
                  setPassword('admin123');
                }}
                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-mono text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                admin@dealpulse.io
              </button>
              <button
                type="button"
                onClick={handleStephenLogin}
                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-mono text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                stephenmayowa112@gmail.com
              </button>
            </div>
            <p className="font-mono text-[10px] text-neutral-400 mt-2">
              Password for all admin accounts: <span className="font-bold text-neutral-700">admin123</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                placeholder="admin@dealpulse.io"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Signing In...' : 'Sign In with Email & Password'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Curated admin access only. All changes reflect in real-time on the public feed.
        </p>
      </div>
    </div>
  );
}
