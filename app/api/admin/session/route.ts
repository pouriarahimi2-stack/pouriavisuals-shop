import { NextRequest, NextResponse } from 'next/server';
import { verifyPayload } from '@/lib/session';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('pv_admin_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = verifyPayload(sessionCookie);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
