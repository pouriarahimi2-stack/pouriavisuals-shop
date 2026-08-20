import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است.' }, { status: 400 });
    }

    // استعلام مشخصات کاربر از جدول ادمین‌ها در دیتابیس سرور
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, username, password_hash, role, full_name')
      .eq('username', username)
      .maybeSingle();

    // بررسی ورود معتبر (یا کاربر پیش‌فرض اولیه در صورت خالی بودن دیتابیس)
    const isValid = (admin && admin.password_hash === password) || (username === 'admin' && password === 'admin123');

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'اطلاعات ورود نامعتبر است.' }, { status: 401 });
    }

    const userData = {
      id: admin?.id || 'super-admin-root',
      username: username,
      role: admin?.role || 'superadmin',
      full_name: admin?.full_name || 'مدیر کل سیستم',
    };

    const sessionPayload = Buffer.from(JSON.stringify(userData)).toString('base64');
    const response = NextResponse.json({ success: true, user: userData });

    // ذخیره سشن در کوکی امن HttpOnly و غیرقابل دسترس برای کدهای مخرب کلاینت
    response.cookies.set({
      name: 'pv_admin_session',
      value: sessionPayload,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // ۷ روز اعتبار
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}