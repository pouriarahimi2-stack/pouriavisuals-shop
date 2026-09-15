import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/authSecurityHelper';
import { authSecurity } from '@/lib/authSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('id, username, full_name, role')
      .eq('username', auth.session.username)
      .maybeSingle();

    return NextResponse.json({ success: true, user: user || auth.session });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const currentPassword = String(body.currentPassword || body.currentPin || '').trim();
    const newPassword = String(body.newPassword || body.newPin || '').trim();
    const newFullName = body.newFullName ? String(body.newFullName).trim() : undefined;
    const newUsername = body.newUsername ? String(body.newUsername).trim().toLowerCase() : undefined;

    // استخراج نام کاربری منحصراً از سشن احراز هویت شده سرور
    const sessionUsername = auth.session.username;

    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', sessionUsername)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ success: false, message: 'کاربر مدیر یافت نشد.' }, { status: 404 });
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        return NextResponse.json({ success: false, message: 'کلمه عبور یا پین جدید باید حداقل ۴ رقم باشد.' }, { status: 400 });
      }

      const storedPass = String(user.password_hash || user.password || user.pin_hash || user.pin || '');
      let isCurrentCorrect = false;

      if (storedPass.includes(':')) {
        isCurrentCorrect = authSecurity.verifyPassword(currentPassword, storedPass);
      } else {
        isCurrentCorrect = (storedPass === currentPassword);
      }

      if (!isCurrentCorrect) {
        return NextResponse.json({ success: false, message: 'کلمه عبور فعلی وارد شده نادرست است.' }, { status: 403 });
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (newPassword) {
      updatePayload.password_hash = authSecurity.hashPassword(newPassword);
      updatePayload.password = null;
      updatePayload.pin_hash = null;
      updatePayload.pin = null;
    }

    if (newFullName) updatePayload.full_name = newFullName;
    if (newUsername && newUsername !== sessionUsername) updatePayload.username = newUsername;

    await supabaseAdmin.from('admin_users').update(updatePayload).eq('id', user.id);

    return NextResponse.json({ success: true, message: 'مشخصات حساب و کلمه عبور با موفقیت بروزرسانی شد.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'خطای سرور.' }, { status: 500 });
  }
}
