import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: {
    test: string;
    description: string;
    passed: boolean;
    details: any;
  }[] = [];

  // Reset to clean seed data before running tests
  db.reset();

  // Test 1: Feed Cursor-based Pagination
  try {
    const page1 = db.getDeals({ limit: 4 });
    const hasNextCursor = !!page1.next_cursor;
    const page1Count = page1.items.length;

    let page2Count = 0;
    let noOverlap = true;

    if (hasNextCursor && page1.next_cursor) {
      const page2 = db.getDeals({ limit: 4, cursor: page1.next_cursor });
      page2Count = page2.items.length;
      const page1Ids = new Set(page1.items.map((i) => i.id));
      for (const item of page2.items) {
        if (page1Ids.has(item.id)) {
          noOverlap = false;
          break;
        }
      }
    }

    const passed = page1Count === 4 && page2Count > 0 && noOverlap && hasNextCursor;
    results.push({
      test: 'Cursor-based Pagination',
      description: 'Fetches page 1 with limit=4, retrieves next_cursor, fetches page 2 without item duplication.',
      passed,
      details: {
        page1Items: page1Count,
        page2Items: page2Count,
        next_cursor: page1.next_cursor,
        noItemOverlap: noOverlap,
      },
    });
  } catch (err: any) {
    results.push({
      test: 'Cursor-based Pagination',
      description: 'Fetches page 1 with limit=4, retrieves next_cursor, fetches page 2 without item duplication.',
      passed: false,
      details: { error: err.message },
    });
  }

  // Test 2: Category Filter
  try {
    const categorySlug = 'audio';
    const audioDeals = db.getDeals({ category: categorySlug, limit: 20 });
    const allMatchCategory =
      audioDeals.items.length > 0 &&
      audioDeals.items.every((d) => d.category?.slug === categorySlug || d.category_id === 'cat-audio');

    results.push({
      test: 'Category Filtering',
      description: 'Filters deals by slug "audio". All returned deals belong to Audio & Sound.',
      passed: allMatchCategory,
      details: {
        matchedCount: audioDeals.items.length,
        itemsCategories: audioDeals.items.map((d) => d.category?.slug),
      },
    });
  } catch (err: any) {
    results.push({
      test: 'Category Filtering',
      description: 'Filters deals by slug "audio". All returned deals belong to Audio & Sound.',
      passed: false,
      details: { error: err.message },
    });
  }

  // Test 3: Search Filter (Title and Description)
  try {
    const searchParam = 'keyboard';
    const searchResults = db.getDeals({ q: searchParam, limit: 20 });
    const foundKeywords = searchResults.items.every((deal) => {
      const match =
        deal.title.toLowerCase().includes('keyboard') ||
        deal.short_description.toLowerCase().includes('keyboard');
      return match;
    });

    results.push({
      test: 'Search (Keyword across Title and Description)',
      description: 'Searches for keyword "keyboard". Verifies matching results in title or description.',
      passed: searchResults.items.length > 0 && foundKeywords,
      details: {
        matchesFound: searchResults.items.length,
        titles: searchResults.items.map((d) => d.title),
      },
    });
  } catch (err: any) {
    results.push({
      test: 'Search (Keyword across Title and Description)',
      description: 'Searches for keyword "keyboard". Verifies matching results in title or description.',
      passed: false,
      details: { error: err.message },
    });
  }

  // Test 4: Expired-Deal Exclusion
  try {
    // We intentionally have 'deal-expired-flash' in seed data which has expires_at in the past
    // and status='expired'.
    const publicFeed = db.getDeals({ limit: 50 });
    const containsExpiredDeal = publicFeed.items.some((d) => d.id === 'deal-expired-flash');
    const containsDraftDeal = publicFeed.items.some((d) => d.id === 'deal-draft-preview');

    const now = Date.now();
    const anyExpiredInFeed = publicFeed.items.some((d) => {
      if (d.status !== 'live') return true;
      if (d.expires_at && new Date(d.expires_at).getTime() <= now) return true;
      return false;
    });

    // Also check if admin with include_all can see expired
    const adminView = db.getDeals({ include_all: true, limit: 50 });
    const adminSeesExpired = adminView.items.some((d) => d.id === 'deal-expired-flash');

    const passed = !containsExpiredDeal && !containsDraftDeal && !anyExpiredInFeed && adminSeesExpired;

    results.push({
      test: 'Expired-Deal & Non-Live Exclusion',
      description: 'Expired deals (past expires_at or status=expired) and drafts are excluded from public feed, but accessible in admin.',
      passed,
      details: {
        publicFeedCount: publicFeed.items.length,
        containsExpiredDealInPublic: containsExpiredDeal,
        containsDraftDealInPublic: containsDraftDeal,
        anyExpiredOrInvalidInFeed: anyExpiredInFeed,
        adminSeesExpired,
      },
    });
  } catch (err: any) {
    results.push({
      test: 'Expired-Deal & Non-Live Exclusion',
      description: 'Expired deals (past expires_at or status=expired) and drafts are excluded from public feed, but accessible in admin.',
      passed: false,
      details: { error: err.message },
    });
  }

  const allPassed = results.every((r) => r.passed);

  return NextResponse.json({
    status: allPassed ? 'all_passed' : 'failures_detected',
    summary: `${results.filter((r) => r.passed).length} of ${results.length} tests passed`,
    timestamp: new Date().toISOString(),
    tests: results,
  });
}
