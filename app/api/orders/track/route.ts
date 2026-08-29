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
        { success: false, message: 'شناسه سفارش یا شماره تماس الزامی است.' },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`order_number.eq.${cleanQuery},id.eq.${cleanQuery},phone.eq.${cleanQuery},tracking_code.eq.${cleanQuery}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error.message);
      return NextResponse.json(
        { success: false, message: 'خطا در واکشی اطلاعات از پایگاه داده.' },
        { status: 500 }
      );
    }

    const matchedOrders = (data || []).map(normalizeOrder);

    if (matchedOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'هیچ سفارشی با این مشخصات یافت نشد.',
        data: [],
      });
    }

    return NextResponse.json({
      success: true,
      data: matchedOrders,
    });
  } catch (error: any) {
    console.error('Track API Error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور در رهگیری سفارش.' },
      { status: 500 }
    );
  }
}