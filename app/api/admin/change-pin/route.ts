import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { verifyAdminSession } from '@/lib/authSecurityHelper';
import { authSecurity } from '@/lib/authSecurity';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    const username = session?.username || "admin";

    let user: any = null;

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('admin_users')
        .select('id, username, full_name, role, created_at')
        .eq('username', username)
        .maybeSingle();
      user = data;
    }

    return NextResponse.json({
      success: true,
      user: user || { username, full_name: "مدیر ارشد آکسون", role: "superadmin" },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newPassword = String(body.newPassword || '').trim();
    const newFullName = body.newFullName ? String(body.newFullName).trim() : undefined;
    const newUsername = body.newUsername ? String(body.newUsername).trim().toLowerCase() : undefined;

    const session = await verifyAdminSession(req);
    const currentUsername = session?.username || "admin";
    const targetUsername = newUsername || currentUsername;

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ success: false, message: "کلمه عبور باید حداقل ۴ نویسه باشد." }, { status: 400 });
    }

    const hashedPassword = authSecurity.hashPassword(newPassword);

    if (supabaseAdmin) {
      // استعلام مستقیم یا ساخت کاربر در صورت نبودن (Upsert تضمینی)
      const { data: existingUser } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('username', currentUsername)
        .maybeSingle();

      if (existingUser) {
        await supabaseAdmin.from('admin_users').update({
          username: targetUsername,
          password_hash: hashedPassword,
          password: hashedPassword,
          full_name: newFullName || existingUser.full_name || targetUsername,
          updated_at: new Date().toISOString(),
        }).eq('id', existingUser.id);
      } else {
        await supabaseAdmin.from('admin_users').insert([{
          id: randomUUID(),
          username: targetUsername,
          password_hash: hashedPassword,
          password: hashedPassword,
          full_name: newFullName || targetUsername,
          role: "superadmin",
          created_at: new Date().toISOString(),
        }]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "✓ کلمه عبور و مشخصات حساب با موفقیت در دیتابیس ثبت و فعال شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "خطا در ذخیره کلمه عبور." }, { status: 500 });
  }
}
