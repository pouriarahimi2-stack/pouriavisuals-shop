// File Path: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ۱. پاسخ فوری و بدون واسطه به ربات تاییدیه اینماد
  if (pathname === '/27424534.txt' || pathname.includes('27424534.txt')) {
    return new NextResponse('27424534', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // ۲. گیت امنیتی پنل مدیریت
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken =
      request.cookies.get('pv_admin_session')?.value ||
      request.cookies.get('admin_session_token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/27424534.txt', '/admin/:path*'],
};