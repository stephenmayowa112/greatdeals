export type DealStatus = 'draft' | 'live' | 'expired';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  dealCount?: number;
}

export interface Deal {
  id: string;
  title: string;
  short_description: string;
  image?: string | null;
  original_price?: number | null;
  discounted_price?: number | null;
  percentage_off?: number | null;
  category_id: string;
  category?: Category;
  source_name: string;
  source_url: string;
  status: DealStatus;
  posted_at: string; // ISO datetime string
  expires_at?: string | null; // ISO datetime string or null
}

export interface DealsQueryParams {
  cursor?: string | null;
  limit?: number;
  category?: string; // category slug or id
  q?: string; // search term
  status?: DealStatus | 'all';
  include_all?: boolean; // admin mode
}

export interface PaginatedDealsResponse {
  items: Deal[];
  next_cursor: string | null;
  has_more: boolean;
  total_matching: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}
