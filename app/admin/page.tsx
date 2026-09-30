'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  Play,
  FileCheck2,
  Sparkles,
  Layers,
  Upload,
  Eye,
} from 'lucide-react';
import { Deal, Category, DealStatus } from '@/lib/types';
import { formatNaira } from '@/lib/utils';

interface TestResult {
  test: string;
  description: string;
  passed: boolean;
  details: any;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Active Tab: 'deals' | 'categories' | 'tests'
  const [activeTab, setActiveTab] = useState<'deals' | 'categories' | 'tests'>('deals');

  // Data States
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ total: 0, live: 0, draft: 0, expired: 0, categories: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Deals Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deal Form Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealForm, setDealForm] = useState({
    title: '',
    short_description: '',
    image: '',
    original_price: '',
    discounted_price: '',
    percentage_off: '',
    category_id: '',
    source_name: '',
    source_url: '',
    status: 'live' as DealStatus,
    expires_at: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Form Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
  });

  // Automated Tests State
  const [testResults, setTestResults] = useState<{
    status: string;
    summary: string;
    timestamp?: string;
    tests: TestResult[];
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth');
        const data = await res.json();
        if (data.authenticated) {
          setIsAdmin(true);
          setAdminUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      }
    }
    checkAuth();
  }, [router]);

  // Load Dashboard Data
  const loadData = useCallback(async () => {
    try {
      const [dealsRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/deals?include_all=true&limit=100'),
        fetch('/api/categories'),
        fetch('/api/admin/seed'),
      ]);

      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.items || []);
      }
      if (categoriesRes.ok) {
        const catsData = await categoriesRes.json();
        setCategories(catsData || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      if (!isAdmin) return;
      try {
        const [dealsRes, categoriesRes, statsRes] = await Promise.all([
          fetch('/api/deals?include_all=true&limit=100'),
          fetch('/api/categories'),
          fetch('/api/admin/seed'),
        ]);

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          if (!ignore) setDeals(dealsData.items || []);
        }
        if (categoriesRes.ok) {
          const catsData = await categoriesRes.json();
          if (!ignore) setCategories(catsData || []);
        }
        if (statsRes.ok) {
          const sData = await statsRes.json();
          if (!ignore) setStats(sData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    initialFetch();

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  // Reseed Dataset
  const handleReseed = async () => {
    if (!window.confirm('Reset database to the initial 20+ sample deals? Any custom edits will be reset.')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await loadData();
        alert('Database successfully reset to seed data!');
      } else {
        alert(data.error || 'Reset failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Create Modal
  const openCreateDealModal = () => {
    setEditingDealId(null);
    setFormError(null);
    setDealForm({
      title: '',
      short_description: '',
      image: '',
      original_price: '',
      discounted_price: '',
      percentage_off: '',
      category_id: categories[0]?.id || '',
      source_name: '',
      source_url: '',
      status: 'live',
      expires_at: '',
    });
    setIsDealModalOpen(true);
  };

  // Open Edit Modal
  const openEditDealModal = (deal: Deal) => {
    setEditingDealId(deal.id);
    setFormError(null);
    setDealForm({
      title: deal.title,
      short_description: deal.short_description,
      image: deal.image || '',
      original_price: deal.original_price ? String(deal.original_price) : '',
      discounted_price: deal.discounted_price ? String(deal.discounted_price) : '',
      percentage_off: deal.percentage_off ? String(deal.percentage_off) : '',
      category_id: deal.category_id,
      source_name: deal.source_name,
      source_url: deal.source_url,
      status: deal.status,
      expires_at: deal.expires_at ? deal.expires_at.slice(0, 16) : '',
    });
    setIsDealModalOpen(true);
  };

  // Calculate percentage automatically
  const handlePriceChange = (field: 'original_price' | 'discounted_price', val: string) => {
    const updated = { ...dealForm, [field]: val };
    const orig = parseFloat(field === 'original_price' ? val : updated.original_price);
    const disc = parseFloat(field === 'discounted_price' ? val : updated.discounted_price);

    if (orig && disc && orig > disc && orig > 0) {
      updated.percentage_off = String(Math.round(((orig - disc) / orig) * 100));
    }
    setDealForm(updated);
  };

  // Image Upload to Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setDealForm((prev) => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Deal (Create or Update)
  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: dealForm.title,
        short_description: dealForm.short_description,
        image: dealForm.image || null,
        original_price: dealForm.original_price ? parseFloat(dealForm.original_price) : null,
        discounted_price: dealForm.discounted_price ? parseFloat(dealForm.discounted_price) : null,
        percentage_off: dealForm.percentage_off ? parseInt(dealForm.percentage_off, 10) : null,
        category_id: dealForm.category_id,
        source_name: dealForm.source_name,
        source_url: dealForm.source_url,
        status: dealForm.status,
        expires_at: dealForm.expires_at ? new Date(dealForm.expires_at).toISOString() : null,
      };

      let res;
      if (editingDealId) {
        res = await fetch(`/api/deals/${editingDealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save deal');

      setIsDealModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle (Live <-> Draft <-> Expired)
  const handleQuickStatusChange = async (dealId: string, newStatus: DealStatus) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Optimistic update
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d))
        );
        // Refresh full stats
        loadData();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Delete Deal
  const handleDeleteDeal = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeals((prev) => prev.filter((d) => d.id !== id));
        loadData();
      } else {
        alert('Failed to delete deal');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingCategoryId) {
        res = await fetch(`/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Deals assigned to it should be reassigned.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to delete category');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Run Feed API Tests
  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      setTestResults(data);
      // Re-sync local data because tests reset store
      await loadData();
    } catch (err) {
      console.error('Error running tests:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Filtered deals for table view
  const filteredDeals = deals.filter((deal) => {
    if (statusFilter !== 'all' && deal.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && deal.category_id !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = deal.title.toLowerCase().includes(q);
      const inDesc = deal.short_description.toLowerCase().includes(q);
      const inSource = deal.source_name.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inSource) return false;
    }
    return true;
  });

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold tracking-tight text-neutral-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>DealPulse Admin</span>
            </Link>
            <span className="text-xs text-neutral-400" aria-hidden="true">/</span>
            <span className="text-xs font-semibold text-neutral-600">Console</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <span>View Public Feed</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={handleReseed}
              title="Reset to 20+ sample deals"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset Seed Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI Metric Overview */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-neutral-500">Total Deals</span>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-neutral-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-emerald-700">Live (Public)</span>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-700">
              {stats.live}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-neutral-600">Drafts</span>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-neutral-600">
              {stats.draft}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <span className="text-xs font-medium text-amber-700">Expired</span>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-700">
              {stats.expired}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-neutral-500">Categories</span>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-neutral-900">
              {stats.categories}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('deals')}
            className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'deals'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Deals Management ({deals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Automated Feed Tests</span>
          </button>
        </div>

        {/* TAB 1: DEALS MANAGEMENT */}
        {activeTab === 'deals' && (
          <div className="space-y-6">
            {/* Filter and Action Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by title, store..."
                    className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-neutral-200 py-1.5 px-3 text-xs font-medium text-neutral-700 bg-white focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="live">Live Only</option>
                  <option value="draft">Drafts Only</option>
                  <option value="expired">Expired Only</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-neutral-200 py-1.5 px-3 text-xs font-medium text-neutral-700 bg-white focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Deal Button */}
              <button
                onClick={openCreateDealModal}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Deal</span>
              </button>
            </div>

            {/* Deals Table */}
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-200 bg-neutral-50/70 font-semibold text-neutral-600">
                    <tr>
                      <th className="py-3 px-4">Deal</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Pricing</th>
                      <th className="py-3 px-4">Store</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredDeals.length > 0 ? (
                      filteredDeals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-100 border border-neutral-200">
                                {deal.image ? (
                                  <Image
                                    src={deal.image}
                                    alt={deal.title}
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                                    No img
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/deals/${deal.id}`}
                                  target="_blank"
                                  className="font-semibold text-neutral-900 hover:underline line-clamp-1"
                                >
                                  {deal.title}
                                </Link>
                                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                  {deal.short_description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-neutral-600 font-medium">
                            {deal.category?.name || 'Unassigned'}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums">
                            {deal.discounted_price ? (
                              <div>
                                <span className="font-bold text-neutral-900">
                                  {formatNaira(deal.discounted_price)}
                                </span>
                                {deal.original_price && (
                                  <span className="block text-[10px] text-neutral-400 line-through">
                                    {formatNaira(deal.original_price)}
                                  </span>
                                )}
                              </div>
                            ) : deal.original_price ? (
                              <span className="font-medium text-neutral-900">
                                {formatNaira(deal.original_price)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">Promo</span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-700">
                            {deal.source_name}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <select
                              value={deal.status}
                              onChange={(e) =>
                                handleQuickStatusChange(deal.id, e.target.value as DealStatus)
                              }
                              className={`rounded-md border py-1 px-2 text-[11px] font-semibold cursor-pointer focus:outline-hidden ${
                                deal.status === 'live'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : deal.status === 'draft'
                                  ? 'border-neutral-200 bg-neutral-100 text-neutral-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              }`}
                            >
                              <option value="live">Live</option>
                              <option value="draft">Draft</option>
                              <option value="expired">Expired</option>
                            </select>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-[11px] text-neutral-500 font-mono tabular-nums">
                            {deal.expires_at ? new Date(deal.expires_at).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditDealModal(deal)}
                                title="Edit Deal"
                                className="p-1 rounded-md text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDeal(deal.id, deal.title)}
                                title="Delete Deal"
                                className="p-1 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                          No deals found matching the active filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Categories</h2>
                <p className="text-xs text-neutral-500">
                  Organize deals into discovery verticals for public feed filtering.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({ name: '', slug: '', description: '' });
                  setIsCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-neutral-900">{cat.name}</h3>
                      <span className="font-mono text-xs text-neutral-400 tabular-nums">
                        {cat.dealCount || 0} live deals
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-neutral-400">slug: {cat.slug}</p>
                    {cat.description && (
                      <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCategoryForm({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                        });
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUTOMATED FEED TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Feed Endpoint Verification Tests
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    Executes automated checks verifying all core API contracts requested in the PRD:
                    cursor-based pagination, category filtering, keyword search across title & description, and expired-deal exclusion.
                  </p>
                </div>
                <button
                  onClick={runTests}
                  disabled={isRunningTests}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`h-3.5 w-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Running Suite...' : 'Execute Test Suite'}</span>
                </button>
              </div>

              {testResults && (
                <div className="mt-6 border-t border-neutral-200 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Summary: {testResults.summary}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        testResults.status === 'all_passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {testResults.status === 'all_passed' ? 'ALL TESTS PASSED' : 'ISSUES DETECTED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {testResults.tests.map((t, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-4 ${
                          t.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {t.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-neutral-900">{t.test}</h4>
                        </div>
                        <p className="mt-1 text-xs text-neutral-600">{t.description}</p>
                        <pre className="mt-2 rounded bg-neutral-900 p-2 text-[11px] font-mono text-neutral-100 overflow-x-auto">
                          {JSON.stringify(t.details, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* DEAL CREATE / EDIT MODAL */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl my-8">
            <h3 className="text-lg font-bold text-neutral-900">
              {editingDealId ? 'Edit Deal' : 'Create New Deal Listing'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live deals will immediately appear on the public feed and individual deal pages.
            </p>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleDealSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={dealForm.short_description}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, short_description: e.target.value })
                  }
                  placeholder="Brief promotional snippet highlighting key features and savings..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={dealForm.category_id}
                    onChange={(e) => setDealForm({ ...dealForm, category_id: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={dealForm.status}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, status: e.target.value as DealStatus })
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden bg-white"
                  >
                    <option value="live">Live (Visible on Home Feed)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="expired">Expired (Hidden from Feed)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Original Price (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dealForm.original_price}
                    onChange={(e) => handlePriceChange('original_price', e.target.value)}
                    placeholder="480000"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Discounted Price (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dealForm.discounted_price}
                    onChange={(e) => handlePriceChange('discounted_price', e.target.value)}
                    placeholder="336000"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    % Off (Auto)
                  </label>
                  <input
                    type="number"
                    value={dealForm.percentage_off}
                    onChange={(e) => setDealForm({ ...dealForm, percentage_off: e.target.value })}
                    placeholder="30"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Retailer Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Store / Source Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={dealForm.source_name}
                    onChange={(e) => setDealForm({ ...dealForm, source_name: e.target.value })}
                    placeholder="e.g. Best Buy, Amazon, Nike"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Outbound URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={dealForm.source_url}
                    onChange={(e) => setDealForm({ ...dealForm, source_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Image Input (URL or Upload) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Product Image (URL or Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dealForm.image}
                    onChange={(e) => setDealForm({ ...dealForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 text-xs font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {dealForm.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded border border-neutral-200">
                      <Image
                        src={dealForm.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[11px] text-neutral-500">Image attached</span>
                  </div>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Optional Expiry Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dealForm.expires_at}
                  onChange={(e) => setDealForm({ ...dealForm, expires_at: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  Deals past this time are automatically hidden from the public feed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingDealId ? 'Update Deal' : 'Publish Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">
              {editingCategoryId ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setCategoryForm({
                      ...categoryForm,
                      name,
                      slug: editingCategoryId ? categoryForm.slug : slug,
                    });
                  }}
                  placeholder="e.g. Smart Home"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Slug (URL Parameter) *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                  placeholder="smart-home"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  placeholder="Short description of this category..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
