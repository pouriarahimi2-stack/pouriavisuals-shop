// File Path: app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { FLAGSHIP_7_PRODUCTS } from '@/services/productService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.id || body.order_number || `ORD-${Date.now().toString().slice(-6)}`;

    const customerName = String(body.customerName || body.customer_name || body.customer?.fullName || body.customer?.name || 'خریدار محترم').trim();
    const phone = String(body.phone || body.customer?.phone || '').trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, '');
    const province = String(body.province || body.customer?.province || 'تهران').trim();
    const city = String(body.city || body.customer?.city || 'تهران').trim();
    const address = String(body.address || body.customer?.address || 'تهران').trim();
    const postalCode = body.postalCode || body.postal_code || body.customer?.postalCode || null;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const couponCode = body.couponCode || body.coupon_code || null;

    let productIds = rawItems.map((i: any) => String(i.productId || i.id || i.product_id)).filter(Boolean);
    let dbProducts: any[] = [];

    try {
      if (supabaseAdmin && productIds.length > 0) {
        const { data } = await supabaseAdmin.from('products').select('*').in('id', productIds);
        if (data) dbProducts = data;
      }
    } catch {}

    let calculatedTotal = 0;
    const validatedItems = rawItems.map((item: any) => {
      const pId = String(item.productId || item.id || item.product_id);
      let matchedDb = dbProducts.find((p: any) => String(p.id) === pId);
      if (!matchedDb) {
        matchedDb = FLAGSHIP_7_PRODUCTS.find((p) => String(p.id) === pId);
      }

      const officialPrice = matchedDb
        ? (matchedDb.discount_price && Number(matchedDb.discount_price) > 0
            ? Number(matchedDb.discount_price)
            : (matchedDb.discountPrice && Number(matchedDb.discountPrice) > 0
                ? Number(matchedDb.discountPrice)
                : Number(matchedDb.price)))
        : Number(item.price || 0);

      const qty = Number(item.quantity || 1);
      calculatedTotal += officialPrice * qty;

      return {
        productId: pId,
        product_id: pId,
        title: item.title || item.name || matchedDb?.title || 'کالای دیجیتال',
        name: item.name || item.title || matchedDb?.title || 'کالای دیجیتال',
        price: officialPrice,
        quantity: qty,
        image: item.image || matchedDb?.image || matchedDb?.images?.[0] || '',
      };
    });

    let discountAmount = Number(body.discountAmount || body.discount_amount || 0);
    if (couponCode) {
      try {
        const { data: coupon } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .eq('code', String(couponCode).trim().toUpperCase())
          .eq('is_active', true)
          .maybeSingle();

        if (coupon) {
          const isPercent = coupon.type === 'percent' || coupon.discount_type === 'percent';
          const val = Number(coupon.value || coupon.discount_value || 0);
          if (isPercent) {
            discountAmount = Math.round((calculatedTotal * val) / 100);
            const maxLimit = Number(coupon.max_discount || coupon.max_discount_amount || 0);
            if (maxLimit > 0 && discountAmount > maxLimit) discountAmount = maxLimit;
          } else {
            discountAmount = val;
          }
        }
      } catch {}
    }

    const finalPayable = Math.max(0, calculatedTotal - discountAmount);

    const orderPayload: any = {
      id: orderId,
      order_number: orderId,
      customer_name: customerName,
      phone: phone || '09120000000',
      province,
      city,
      address,
      items: validatedItems,
      total_amount: calculatedTotal,
      discount_amount: discountAmount,
      final_amount: finalPayable,
      status: body.status || 'pending',
      payment_status: body.payment_status || body.paymentStatus || 'pending',
      payment_method: body.payment_method || body.paymentMethod || 'online',
      tracking_code: body.tracking_code || body.trackingCode || null,
      notes: body.notes || body.customer?.notes || '',
      updated_at: new Date().toISOString(),
    };

    if (postalCode) orderPayload.postal_code = String(postalCode).trim();
    if (couponCode) orderPayload.coupon_code = String(couponCode).trim().toUpperCase();

    try {
      await supabaseAdmin.from('orders').upsert(orderPayload, { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('Orders db upsert warning:', dbErr);
    }

    for (const item of validatedItems) {
      if (item.productId && supabaseAdmin) {
        try {
          const { data: currentP } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", item.productId)
            .maybeSingle();

          if (currentP && currentP.stock !== null && currentP.stock !== undefined) {
            const newStock = Math.max(0, Number(currentP.stock) - Number(item.quantity || 1));
            await supabaseAdmin
              .from("products")
              .update({ stock: newStock, is_available: newStock > 0 })
              .eq("id", item.productId);
          }
        } catch (stkErr) {
          console.warn("Stock decrease atomic error:", stkErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت اعتبارسنجی و ثبت گردید.',
      data: orderPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'خطا در ثبت فاکتور' }, { status: 500 });
  }
}
