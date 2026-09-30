import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DealStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10;
    const category = searchParams.get('category') || undefined;
    const q = searchParams.get('q') || undefined;
    const status = (searchParams.get('status') as DealStatus | 'all') || 'live';
    const include_all = searchParams.get('include_all') === 'true';

    const result = db.getDeals({
      cursor,
      limit,
      category,
      q,
      status,
      include_all,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      short_description,
      image,
      original_price,
      discounted_price,
      percentage_off,
      category_id,
      source_name,
      source_url,
      status,
      expires_at,
    } = body;

    if (!title || !short_description || !category_id || !source_name || !source_url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, short_description, category_id, source_name, and source_url are required.' },
        { status: 400 }
      );
    }

    const newDeal = db.createDeal({
      title,
      short_description,
      image,
      original_price: original_price ? parseFloat(original_price) : null,
      discounted_price: discounted_price ? parseFloat(discounted_price) : null,
      percentage_off: percentage_off ? parseInt(percentage_off, 10) : undefined,
      category_id,
      source_name,
      source_url,
      status: status || 'live',
      expires_at: expires_at || null,
    });

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create deal' },
      { status: 400 }
    );
  }
}
