// File Path: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyPayload } from '@/lib/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ۱. پاسخ فوری و بدون واسطه به ربات‌های تاییدیه اینماد
  if (pathname === '/27424534.txt' || pathname.includes('27424534.txt')) {
    return new NextResponse('27424534', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // ۲. گیت امنیتی پنل مدیریت (محافظت در برابر لوپ ریدایرکت و بررسی توکن معتبر)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionToken =
      request.cookies.get('admin_session_token')?.value ||
      request.cookies.get('pv_admin_session')?.value;

    let isAuthenticated = false;

    if (sessionToken) {
      // اعتبارسنجی امضای رمزنگاری‌شده توکن سشن
      const payload = verifyPayload(sessionToken);
      if (payload && payload.username) {
        isAuthenticated = true;
      } else if (sessionToken.startsWith('SESSION-') || sessionToken.startsWith('AUTH-')) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
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