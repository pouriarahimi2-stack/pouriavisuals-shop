import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('pv_admin_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}