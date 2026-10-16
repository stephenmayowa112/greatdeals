'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, KeyRound, AlertCircle, Zap } from 'lucide-react';

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

      if (!res.ok || !data.authenticated) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      handleLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleInstantLogin = async () => {
    await executeLogin('admin@dealpulse.io', 'admin123');
  };

  const handleStephenLogin = async () => {
    await executeLogin('stephenmayowa112@gmail.com', 'admin123');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F6F9] p-4 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Public Feed</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Authentication</h1>
              <p className="text-xs text-slate-500">DealPulse curation & management portal</p>
            </div>
          </div>

          {/* 1-Click Instant Demo Login CTA */}
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                  <Zap className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                  Instant One-Click Access
                </span>
                <p className="text-[11px] text-emerald-700/90 mt-0.5">
                  Bypass manual input and log in directly as Administrator.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleInstantLogin}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>1-Click Instant Admin Login</span>
            </button>
          </div>

          {/* Quick Credential Presets */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-600">
            <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
              <span>Quick-Fill Accounts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@dealpulse.io');
                  setPassword('admin123');
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs"
              >
                admin@dealpulse.io
              </button>
              <button
                type="button"
                onClick={handleStephenLogin}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer shadow-2xs"
              >
                stephenmayowa112@gmail.com
              </button>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-2">
              Default password: <code className="text-slate-600">admin123</code>
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                placeholder="admin@dealpulse.io"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Sign In with Email & Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
