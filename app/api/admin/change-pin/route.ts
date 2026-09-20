import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { verifyAdminSession } from '@/lib/authSecurityHelper';
import { authSecurity } from '@/lib/authSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    const username = session?.username || "admin";

    let user: any = null;
    let staffList: any[] = [];

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('admin_users')
        .select('id, username, full_name, role, created_at')
        .eq('username', username)
        .maybeSingle();
      user = data;

      const { data: allStaff } = await supabaseAdmin
        .from('admin_users')
        .select('id, username, full_name, role, created_at')
        .order('created_at', { ascending: false });
      staffList = allStaff || [];
    }

    return NextResponse.json({
      success: true,
      user: user || { username, full_name: "مدیر ارشد سیستم", role: "superadmin" },
      staff: staffList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ۱. ایجاد مدیر/کارشناس جدید با تعیین نقش
    if (action === "create_staff") {
      const { username, password, full_name, role } = body;
      const cleanUser = String(username || "").trim().toLowerCase();
      const cleanPass = String(password || "").trim();

      if (!cleanUser || cleanPass.length < 4) {
        return NextResponse.json({ success: false, message: "نام کاربری و کلمه عبور حداقل ۴ کاراکتری الزامی است." }, { status: 400 });
      }

      const hashedPassword = authSecurity.hashPassword(cleanPass);
      const newStaff = {
        username: cleanUser,
        password_hash: hashedPassword,
        full_name: full_name?.trim() || cleanUser,
        role: role || "content_editor",
        created_at: new Date().toISOString(),
      };

      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.from('admin_users').insert([newStaff]);
        if (error) return NextResponse.json({ success: false, message: "این نام کاربری قبلاً ثبت شده است." }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: `کاربر جدید «${cleanUser}» با نقش ${role} با موفقیت ثبت شد.` });
    }

    // ۲. تغییر رمز عبور مدیر جاری
    const currentPassword = String(body.currentPassword || '').trim();
    const newPassword = String(body.newPassword || '').trim();
    const newFullName = body.newFullName ? String(body.newFullName).trim() : undefined;
    const newUsername = body.newUsername ? String(body.newUsername).trim().toLowerCase() : undefined;

    const session = await verifyAdminSession(req);
    const sessionUsername = session?.username || "admin";

    if (supabaseAdmin) {
      const { data: user } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('username', sessionUsername)
        .maybeSingle();

      if (user && newPassword) {
        const storedPass = String(user.password_hash || user.password || '');
        const isMatch = authSecurity.verifyPassword(currentPassword, storedPass) || storedPass === currentPassword;
        if (!isMatch) {
          return NextResponse.json({ success: false, message: 'کلمه عبور فعلی نادرست است.' }, { status: 403 });
        }
      }

      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (newPassword) {
        updatePayload.password_hash = authSecurity.hashPassword(newPassword);
      }
      if (newFullName) updatePayload.full_name = newFullName;
      if (newUsername) updatePayload.username = newUsername;

      if (user) {
        await supabaseAdmin.from('admin_users').update(updatePayload).eq('id', user.id);
      }
    }

    return NextResponse.json({ success: true, message: 'مشخصات حساب و کلمه عبور با موفقیت در دیتابیس تغییر یافت.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
