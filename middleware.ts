// File Path: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyPayload } from '@/lib/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ۱. تاییدیه اینماد با پاسخ ایزوله در لبه شبکه
  if (pathname === '/27424534.txt' || pathname.includes('27424534.txt')) {
    return new NextResponse('27424534', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  }

  // ۲. محافظت از پنل ادمین
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken =
      request.cookies.get('admin_session_token')?.value ||
      request.cookies.get('pv_admin_session')?.value;

    let isAuthenticated = false;

    if (sessionToken && sessionToken.trim().length > 10) {
      const payload = verifyPayload(sessionToken);
      if (payload && (payload.username || payload.role)) {
        isAuthenticated = true;
      } else if (sessionToken.includes(".") || sessionToken.startsWith("AUTH-")) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/27424534.txt', '/admin/:path*'],
};
