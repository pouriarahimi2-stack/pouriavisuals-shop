import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { signPayload } from '@/lib/session';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است.' }, { status: 400 });
    }

    // استعلام از جدول admin_users (یا admins)
    let adminRecord: any = null;

    const { data: userFromAdminUsers } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (userFromAdminUsers) {
      adminRecord = userFromAdminUsers;
    } else {
      const { data: userFromAdmins } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (userFromAdmins) adminRecord = userFromAdmins;
    }

    // تابع کمکی برای هش کردن رمز عبور با الگوریتم SHA-256
    const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

    // بررسی صحت رمز عبور با پشتیبانی همزمان از متن خام و هش شده
    const isDbPasswordValid = adminRecord && (
      adminRecord.password === password || 
      adminRecord.password_hash === password ||
      adminRecord.password_hash === sha256(password) ||
      adminRecord.password === sha256(password)
    );

    // بک‌دور پیش‌فرض فقط در محیط توسعه (غیر پروداکشن) کار می‌کند
    const isDefaultDevValid = process.env.NODE_ENV !== 'production' && username === 'admin' && password === 'admin123';

    if (!isDbPasswordValid && !isDefaultDevValid) {
      return NextResponse.json({ success: false, message: 'اطلاعات ورود نامعتبر است.' }, { status: 401 });
    }

    const userData = {
      id: adminRecord?.id || 'super-admin-root',
      username: username,
      role: adminRecord?.role || 'superadmin',
      full_name: adminRecord?.full_name || 'مدیر کل سیستم',
    };

    const sessionPayload = signPayload(userData);
    const response = NextResponse.json({ success: true, user: userData });

    // تنظیم کوکی نشست
    response.cookies.set({
      name: 'pv_admin_session',
      value: sessionPayload,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}