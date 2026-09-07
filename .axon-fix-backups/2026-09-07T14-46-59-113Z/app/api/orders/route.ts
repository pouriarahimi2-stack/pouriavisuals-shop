// File Path: app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { FLAGSHIP_7_PRODUCTS } from "@/services/productCatalog";

export const dynamic = "force-dynamic";

function generateGuestCredentials(fullName: string, phone: string) {
  const clean = String(fullName || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 10);
  const rand = Math.floor(100 + Math.random() * 900);
  return {
    username: `${clean || "buyer"}_${rand}`,
    password: `${phone.slice(-4)}_${Math.random().toString(36).slice(-4)}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName || body.customer_name || body.customer?.fullName || body.customer?.name || "").trim();
    const phone = String(body.phone || body.customer?.phone || "").trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");
    const province = String(body.province || body.customer?.province || "تهران").trim();
    const city = String(body.city || body.customer?.city || "تهران").trim();
    const address = String(body.address || body.customer?.address || "").trim();
    const postalCode = body.postalCode || body.postal_code || body.customer?.postalCode || null;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const couponCode = body.couponCode || body.coupon_code || null;

    if (!customerName || !phone || !address || rawItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "مشخصات تحویل‌گیرنده، شماره تماس و اقلام سفارش الزامی هستند." },
        { status: 400 }
      );
    }

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل وارد شده باید ۱۱ رقمی و با ۰۹ شروع شود." },
        { status: 400 }
      );
    }

    const orderId = body.id || body.order_number || `ORD-${Date.now().toString().slice(-6)}`;
    const { username: guestUsername, password: guestPassword } = generateGuestCredentials(customerName, phone);

    const productIds = rawItems.map((i: any) => String(i.productId || i.id || i.product_id)).filter(Boolean);
    let dbProducts: any[] = [];

    if (supabaseAdmin && productIds.length > 0) {
      const { data } = await supabaseAdmin.from("products").select("*").in("id", productIds);
      if (data) dbProducts = data;
    }

    const fallbackCatalog = Array.isArray(FLAGSHIP_7_PRODUCTS) ? FLAGSHIP_7_PRODUCTS : [];
    let calculatedTotal = 0;
    const validatedItems: any[] = [];

    for (const item of rawItems) {
      const pId = String(item.productId || item.id || item.product_id);
      let matched = dbProducts.find((p: any) => String(p.id) === pId);
      if (!matched) {
        matched = fallbackCatalog.find((p) => String(p.id) === pId);
      }

      // فایروال ضدتقلب: اگر کالایی در دیتابیس یا کاتالوگ معتبر یافت نشود، رد قطعی می‌شود
      if (!matched) {
        return NextResponse.json(
          { success: false, message: `کالای درخواستی با شناسه «${pId}» نامعتبر است.` },
          { status: 400 }
        );
      }

      const officialPrice = matched.discount_price && Number(matched.discount_price) > 0
        ? Number(matched.discount_price)
        : (matched.discountPrice && Number(matched.discountPrice) > 0
            ? Number(matched.discountPrice)
            : Number(matched.price || 0));

      const qty = Math.max(1, Number(item.quantity || 1));
      calculatedTotal += officialPrice * qty;

      validatedItems.push({
        productId: pId,
        product_id: pId,
        title: matched.title || matched.name || "کالای دیجیتال استودیویی",
        name: matched.title || matched.name || "کالای دیجیتال استودیویی",
        price: officialPrice,
        quantity: qty,
        image: matched.image || matched.images?.[0] || "",
      });
    }

    let discountAmount = 0;
    if (couponCode && supabaseAdmin) {
      try {
        const { data: coupon } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .eq("code", String(couponCode).trim().toUpperCase())
          .eq("is_active", true)
          .maybeSingle();

        if (coupon) {
          const isPercent = coupon.type === "percent" || coupon.discount_type === "percent";
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
      phone,
      province,
      city,
      address,
      items: validatedItems,
      total_amount: calculatedTotal,
      discount_amount: discountAmount,
      final_amount: finalPayable,
      status: body.status || "pending",
      payment_status: body.payment_status || body.paymentStatus || "pending",
      payment_method: body.payment_method || body.paymentMethod || "online",
      tracking_code: body.tracking_code || body.trackingCode || null,
      notes: body.notes || body.customer?.notes || "",
      guest_username: guestUsername,
      guest_password: guestPassword,
      updated_at: new Date().toISOString(),
    };

    if (postalCode) orderPayload.postal_code = String(postalCode).trim();
    if (couponCode) orderPayload.coupon_code = String(couponCode).trim().toUpperCase();

    if (supabaseAdmin) {
      await supabaseAdmin.from("orders").upsert(orderPayload, { onConflict: "id" });

      // کسر اتمیک موجودی انبار برای کالاهای ثبت‌شده
      for (const it of validatedItems) {
        try {
          const { data: currentP } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", it.productId)
            .maybeSingle();

          if (currentP && currentP.stock !== null && currentP.stock !== undefined) {
            const newStock = Math.max(0, Number(currentP.stock) - Number(it.quantity || 1));
            await supabaseAdmin
              .from("products")
              .update({ stock: newStock, is_available: newStock > 0 })
              .eq("id", it.productId);
          }
        } catch (stkErr) {
          console.warn("Stock decrement notice:", stkErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "فاکتور رسمی با موفقیت اعتبارسنجی و صادر شد.",
      data: orderPayload,
    });
  } catch (err: any) {
    console.error("Order Route Error:", err);
    return NextResponse.json({ success: false, message: err?.message || "خطا در ثبت فاکتور" }, { status: 500 });
  }
}