import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_CREDENTIALS = {
  email: 'admin@dealpulse.io',
  password: 'admin123',
  name: 'DealPulse Admin',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Verify admin credentials
    // Allow either the standard default credentials or the user's email stephenmayowa112@gmail.com
    const isAuthorized =
      (email?.trim().toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) ||
      (email?.trim().toLowerCase() === 'stephenmayowa112@gmail.com' && password === 'admin123') ||
      (password === 'admin123'); // Convenient preview fallback

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Invalid email or password. Use demo credentials (admin@dealpulse.io / admin123)' },
        { status: 401 }
      );
    }

    const token = Buffer.from(
      JSON.stringify({
        email: email || ADMIN_CREDENTIALS.email,
        name: email?.includes('stephen') ? 'Stephen Mayowa' : ADMIN_CREDENTIALS.name,
        role: 'admin',
        exp: Date.now() + 7 * 86400 * 1000,
      })
    ).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: {
        email: email || ADMIN_CREDENTIALS.email,
        name: email?.includes('stephen') ? 'Stephen Mayowa' : ADMIN_CREDENTIALS.name,
        role: 'admin',
      },
      token,
    });

    response.cookies.set('admin_session', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86400,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed.exp && parsed.exp > Date.now()) {
      const stats = db.getStats();
      return NextResponse.json({
        authenticated: true,
        user: { email: parsed.email, name: parsed.name, role: parsed.role },
        stats,
      });
    }
  } catch {
    // invalid token
  }

  return NextResponse.json({ authenticated: false }, { status: 200 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('admin_session');
  return response;
}
