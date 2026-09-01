// File Path: app/api/orders/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { normalizeOrder } from '@/services/orderService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش یا شماره تماس الزامی است.', data: [] },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    // پشتیبانی کامل از استعلام همه سفارشات برای پیشخوان ادمین و CRM
    if (cleanQuery.toLowerCase() === 'all') {
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          return NextResponse.json({
            success: true,
            data: data.map(normalizeOrder),
          });
        }
      } catch {}

      return NextResponse.json({ success: true, data: [] });
    }

    // جستجوی چندگانه بر اساس شماره سفارش، شناسه، شماره تلفن یا کد رهگیری پستی
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`order_number.eq.${cleanQuery},id.eq.${cleanQuery},phone.eq.${cleanQuery},tracking_code.eq.${cleanQuery},customer_name.ilike.%${cleanQuery}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database track query error:', error.message);
      return NextResponse.json(
        { success: false, message: 'خطا در واکشی اطلاعات از پایگاه داده.', data: [] },
        { status: 500 }
      );
    }

    const matchedOrders = (data || []).map(normalizeOrder);

    return NextResponse.json({
      success: true,
      data: matchedOrders,
      message: matchedOrders.length > 0 ? 'اطلاعات سفارش با موفقیت یافت شد.' : 'سفارشی با این مشخصات یافت نشد.',
    });
  } catch (error: any) {
    console.error('Track API Error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور در رهگیری فاکتور.', data: [] },
      { status: 500 }
    );
  }
}
