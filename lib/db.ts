import { Category, Deal, DealStatus, DealsQueryParams, PaginatedDealsResponse } from './types';
import { INITIAL_CATEGORIES, INITIAL_DEALS } from './seed-data';

// Server-side persistent storage container
interface GlobalStore {
  categories: Category[];
  deals: Deal[];
  isInitialized: boolean;
}

// Attach to globalThis in Node environment to survive module re-evaluations during development
const globalForDeals = globalThis as unknown as {
  __dealsStore?: GlobalStore;
};

function getStore(): GlobalStore {
  if (!globalForDeals.__dealsStore) {
    globalForDeals.__dealsStore = {
      categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
      deals: JSON.parse(JSON.stringify(INITIAL_DEALS)),
      isInitialized: true,
    };
  }
  return globalForDeals.__dealsStore;
}

// Auto-sync expiration status: if expires_at < now, flip status to expired
export function syncExpiredDeals(deals: Deal[]): void {
  const now = Date.now();
  for (const deal of deals) {
    if (deal.status === 'live' && deal.expires_at) {
      const expiry = new Date(deal.expires_at).getTime();
      if (!isNaN(expiry) && expiry <= now) {
        deal.status = 'expired';
      }
    }
  }
}

// Helper to encode and decode cursors
// Cursor format: base64(posted_at:id)
export function encodeCursor(posted_at: string, id: string): string {
  const raw = `${posted_at}::${id}`;
  return Buffer.from(raw, 'utf8').toString('base64');
}

export function decodeCursor(cursor: string): { posted_at: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf8');
    const [posted_at, id] = raw.split('::');
    if (posted_at && id) {
      return { posted_at, id };
    }
    return null;
  } catch {
    return null;
  }
}

// Compute discount percentage if missing
export function calculatePercentageOff(orig?: number | null, disc?: number | null): number | null {
  if (orig && disc && orig > 0 && disc < orig) {
    return Math.round(((orig - disc) / orig) * 100);
  }
  return null;
}

export const db = {
  // Reset seed data
  reset(): void {
    const store = getStore();
    store.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    store.deals = JSON.parse(JSON.stringify(INITIAL_DEALS));
  },

  // Categories
  getCategories(): Category[] {
    const store = getStore();
    syncExpiredDeals(store.deals);
    
    // Attach live deal counts
    return store.categories.map((cat) => {
      const count = store.deals.filter(
        (d) => d.category_id === cat.id && d.status === 'live'
      ).length;
      return {
        ...cat,
        dealCount: count,
      };
    });
  },

  getCategoryById(id: string): Category | undefined {
    const store = getStore();
    return store.categories.find((c) => c.id === id);
  },

  getCategoryBySlug(slug: string): Category | undefined {
    const store = getStore();
    return store.categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
  },

  createCategory(data: { name: string; slug: string; description?: string }): Category {
    const store = getStore();
    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const existing = store.categories.find((c) => c.slug === slug);
    if (existing) {
      throw new Error(`Category with slug '${slug}' already exists.`);
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      slug,
      description: data.description?.trim(),
      dealCount: 0,
    };
    store.categories.push(newCategory);
    return newCategory;
  },

  updateCategory(id: string, data: Partial<Category>): Category | null {
    const store = getStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return null;

    if (data.name !== undefined) cat.name = data.name.trim();
    if (data.slug !== undefined) {
      cat.slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    }
    if (data.description !== undefined) cat.description = data.description.trim();
    return cat;
  },

  deleteCategory(id: string): boolean {
    const store = getStore();
    const index = store.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    store.categories.splice(index, 1);
    return true;
  },

  // Deals
  getDeals(params: DealsQueryParams = {}): PaginatedDealsResponse {
    const store = getStore();
    syncExpiredDeals(store.deals);

    const {
      cursor = null,
      limit = 10,
      category,
      q,
      status,
      include_all = false,
    } = params;

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

    // Resolve category if slug is given
    let targetCategoryId: string | undefined;
    if (category && category !== 'all') {
      const foundCat = store.categories.find(
        (c) => c.slug.toLowerCase() === category.toLowerCase() || c.id === category
      );
      if (foundCat) {
        targetCategoryId = foundCat.id;
      } else {
        // Unknown category returns empty results
        return { items: [], next_cursor: null, has_more: false, total_matching: 0 };
      }
    }

    // Filter deals
    const now = Date.now();
    let filtered = store.deals.filter((deal) => {
      // Admin request can request all or specific status
      if (include_all) {
        if (status && status !== 'all' && deal.status !== status) {
          return false;
        }
      } else {
        // Public feed: strictly live and not expired
        if (deal.status !== 'live') return false;
        if (deal.expires_at) {
          const exp = new Date(deal.expires_at).getTime();
          if (!isNaN(exp) && exp <= now) return false;
        }
      }

      // Category filter
      if (targetCategoryId && deal.category_id !== targetCategoryId) {
        return false;
      }

      // Search keyword filter across title and short_description
      if (q && q.trim()) {
        const query = q.trim().toLowerCase();
        const inTitle = deal.title.toLowerCase().includes(query);
        const inDesc = deal.short_description.toLowerCase().includes(query);
        const inSource = deal.source_name.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inSource) {
          return false;
        }
      }

      return true;
    });

    // Populate category object
    const enriched = filtered.map((d) => ({
      ...d,
      category: store.categories.find((c) => c.id === d.category_id),
    }));

    // Sort newest first: posted_at DESC, id DESC
    enriched.sort((a, b) => {
      const timeA = new Date(a.posted_at).getTime();
      const timeB = new Date(b.posted_at).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });

    const totalMatching = enriched.length;

    // Apply cursor pagination
    let startIndex = 0;
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        const targetTime = new Date(decoded.posted_at).getTime();
        const index = enriched.findIndex((deal) => {
          const dealTime = new Date(deal.posted_at).getTime();
          if (dealTime < targetTime) return true;
          if (dealTime === targetTime && deal.id.localeCompare(decoded.id) < 0) return true;
          return false;
        });
        if (index !== -1) {
          startIndex = index;
        } else {
          startIndex = enriched.length;
        }
      }
    }

    const items = enriched.slice(startIndex, startIndex + parsedLimit);
    const hasMore = startIndex + parsedLimit < enriched.length;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = encodeCursor(lastItem.posted_at, lastItem.id);
    }

    return {
      items,
      next_cursor: nextCursor,
      has_more: hasMore,
      total_matching: totalMatching,
    };
  },

  getDealById(id: string): Deal | null {
    const store = getStore();
    syncExpiredDeals(store.deals);
    const deal = store.deals.find((d) => d.id === id);
    if (!deal) return null;

    return {
      ...deal,
      category: store.categories.find((c) => c.id === deal.category_id),
    };
  },

  createDeal(data: {
    title: string;
    short_description: string;
    image?: string | null;
    original_price?: number | null;
    discounted_price?: number | null;
    percentage_off?: number | null;
    category_id: string;
    source_name: string;
    source_url: string;
    status?: DealStatus;
    expires_at?: string | null;
    posted_at?: string;
  }): Deal {
    const store = getStore();

    // Verify category exists
    const categoryExists = store.categories.some((c) => c.id === data.category_id);
    if (!categoryExists) {
      throw new Error(`Category ID '${data.category_id}' does not exist.`);
    }

    let percentage = data.percentage_off;
    if (percentage === undefined || percentage === null) {
      percentage = calculatePercentageOff(data.original_price, data.discounted_price);
    }

    const newDeal: Deal = {
      id: `deal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      short_description: data.short_description.trim(),
      image: data.image?.trim() || null,
      original_price: data.original_price !== undefined ? data.original_price : null,
      discounted_price: data.discounted_price !== undefined ? data.discounted_price : null,
      percentage_off: percentage,
      category_id: data.category_id,
      source_name: data.source_name.trim(),
      source_url: data.source_url.trim(),
      status: data.status || 'live',
      posted_at: data.posted_at || new Date().toISOString(),
      expires_at: data.expires_at || null,
    };

    store.deals.unshift(newDeal);
    syncExpiredDeals(store.deals);

    return {
      ...newDeal,
      category: store.categories.find((c) => c.id === newDeal.category_id),
    };
  },

  updateDeal(id: string, data: Partial<Deal>): Deal | null {
    const store = getStore();
    const deal = store.deals.find((d) => d.id === id);
    if (!deal) return null;

    if (data.title !== undefined) deal.title = data.title.trim();
    if (data.short_description !== undefined) deal.short_description = data.short_description.trim();
    if (data.image !== undefined) deal.image = data.image ? data.image.trim() : null;
    if (data.original_price !== undefined) deal.original_price = data.original_price;
    if (data.discounted_price !== undefined) deal.discounted_price = data.discounted_price;

    if (data.percentage_off !== undefined) {
      deal.percentage_off = data.percentage_off;
    } else if (deal.original_price && deal.discounted_price) {
      deal.percentage_off = calculatePercentageOff(deal.original_price, deal.discounted_price);
    }

    if (data.category_id !== undefined) {
      const exists = store.categories.some((c) => c.id === data.category_id);
      if (exists) deal.category_id = data.category_id;
    }

    if (data.source_name !== undefined) deal.source_name = data.source_name.trim();
    if (data.source_url !== undefined) deal.source_url = data.source_url.trim();
    if (data.status !== undefined) deal.status = data.status;
    if (data.expires_at !== undefined) deal.expires_at = data.expires_at;

    syncExpiredDeals(store.deals);

    return {
      ...deal,
      category: store.categories.find((c) => c.id === deal.category_id),
    };
  },

  deleteDeal(id: string): boolean {
    const store = getStore();
    const index = store.deals.findIndex((d) => d.id === id);
    if (index === -1) return false;
    store.deals.splice(index, 1);
    return true;
  },

  getStats(): {
    total: number;
    live: number;
    draft: number;
    expired: number;
    categories: number;
  } {
    const store = getStore();
    syncExpiredDeals(store.deals);

    return {
      total: store.deals.length,
      live: store.deals.filter((d) => d.status === 'live').length,
      draft: store.deals.filter((d) => d.status === 'draft').length,
      expired: store.deals.filter((d) => d.status === 'expired').length,
      categories: store.categories.length,
    };
  },
};
