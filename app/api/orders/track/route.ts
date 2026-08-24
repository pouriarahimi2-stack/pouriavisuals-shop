import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeOrder } from '@/services/orderService';

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

    // جستجو در فیلدهای مختلف سفارش در جدول orders
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.eq.${cleanQuery},id.eq.${cleanQuery},customer_phone.eq.${cleanQuery},tracking_code.eq.${cleanQuery}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error.message);
      return NextResponse.json(
        { success: false, message: 'خطا در واکشی اطلاعات از پایگاه داده.' },
        { status: 500 }
      );
    }

    // در صورتی که فیلدهای تخت پیدا نشد، بررسی کل سفارشات برای تطبیق درون آبجکت customer
    let matchedOrders = data || [];

    if (matchedOrders.length === 0) {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      matchedOrders = (allOrders || []).filter((ord: any) => {
        const norm = normalizeOrder(ord);
        return (
          String(norm.id) === cleanQuery ||
          norm.orderNumber === cleanQuery ||
          norm.customer.phone === cleanQuery ||
          norm.trackingCode === cleanQuery
        );
      });
    }

    if (matchedOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'هیچ سفارشی با این مشخصات یافت نشد.',
        data: [],
      });
    }

    // فرمت‌بندی خروجی منطبق با استیت‌های کامپوننت فرانت‌اند
    const formattedData = matchedOrders.map((ord: any) => {
      const norm = normalizeOrder(ord);
      return {
        id: norm.orderNumber || norm.id,
        orderNumber: norm.orderNumber,
        customerName: norm.customer.fullName || norm.customer.name || 'مشتری گرامی',
        phone: norm.customer.phone,
        address: norm.customer.address,
        postalCode: norm.customer.postalCode,
        items: norm.items,
        totalAmount: norm.finalAmount || norm.totalAmount,
        discountAmount: norm.discountAmount,
        status: norm.status,
        trackingCode: norm.trackingCode,
        createdAt: norm.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Track API Error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور در رهگیری سفارش.' },
      { status: 500 }
    );
  }
}