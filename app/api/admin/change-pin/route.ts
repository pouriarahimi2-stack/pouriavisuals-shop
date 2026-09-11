import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function hashSecret(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { currentPin, newPin, username } = await req.json();

    if (!currentPin || !newPin) {
      return NextResponse.json({ success: false, message: 'پین فعلی و جدید الزامی هستند.' }, { status: 400 });
    }

    if (String(newPin).length < 4) {
      return NextResponse.json({ success: false, message: 'پین جدید باید حداقل ۴ رقم باشد.' }, { status: 400 });
    }

    const cleanUsername = String(username || 'admin').trim();
    const { data: user } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ success: false, message: 'کاربر مدیر یافت نشد.' }, { status: 404 });
    }

    const currentHash = hashSecret(String(currentPin));
    const isPinCorrect = user.pin_hash ? user.pin_hash === currentHash : (user.pin === currentPin);

    if (!isPinCorrect) {
      return NextResponse.json({ success: false, message: 'پین فعلی وارد شده اشتباه است.' }, { status: 403 });
    }

    const newHash = hashSecret(String(newPin));
    await supabaseAdmin
      .from('admin_users')
      .update({
        pin_hash: newHash,
        pin: null, // حذف فیلد پلین‌تکست
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true, message: 'پین امنیتی با موفقیت بروزرسانی شد.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'خطای سرور.' }, { status: 500 });
  }
}
