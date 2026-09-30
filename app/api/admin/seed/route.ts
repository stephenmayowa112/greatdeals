import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    db.reset();
    const stats = db.getStats();
    return NextResponse.json({
      success: true,
      message: 'Deals and categories reset to initial 20+ seed dataset.',
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = db.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to get stats' },
      { status: 500 }
    );
  }
}
