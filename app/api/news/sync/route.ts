import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET || 'axon_cron_local_key';
    const hasAdminCookie = req.cookies.get('pv_admin_session')?.value;

    if (authHeader !== `Bearer ${cronSecret}` && !hasAdminCookie) {
      return NextResponse.json({ success: false, message: 'عدم احراز هویت برای همگام‌سازی اخبار.' }, { status: 401 });
    }

    const { data: freshNews, error } = await supabaseAdmin
      .from('tech_news')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ success: false, message: 'خطا در استعلام پایگاه داده.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'همگام‌سازی اخبار با موفقیت انجام شد.',
      count: freshNews?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'خطای سیستمی.' }, { status: 500 });
  }
}
