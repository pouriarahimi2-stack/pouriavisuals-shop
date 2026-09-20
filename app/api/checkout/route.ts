import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, total_price } = body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "اطلاعات سبد خرید یا گیرنده نامعتبر است." },
        { status: 400 }
      );
    }

    // اعتبارسنجی فیلدهای اجباری مشتری
    if (!customer.name || !customer.phone || !customer.address) {
      return NextResponse.json(
        {
          success: false,
          message: "نام، شماره موبایل و آدرس کامل الزامی است.",
        },
        { status: 400 }
      );
    }

    const cleanPhone  = customer.phone.trim().replace(/^\+98/, "0");
    const orderNumber = "AXON-" + Math.floor(100000 + Math.random() * 900000);
    const orderId     = randomUUID();
    const amountToman = Number(total_price) || 0;

    // ── ۱. بررسی یا ایجاد حساب کاربری ──────────────────────────
    let userId = "";
    try {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id, name, phone")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
        if (customer.name && existingUser.name !== customer.name) {
          await supabaseAdmin
            .from("users")
            .update({ name: customer.name })
            .eq("id", userId);
        }
      } else {
        userId = randomUUID();
        await supabaseAdmin.from("users").insert([
          {
            id:         userId,
            phone:      cleanPhone,
            name:       customer.name || "مشتری گرامی",
            role:       "customer",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (userErr) {
      console.error("خطا در همگام‌سازی کاربر:", userErr);
    }

    // ── ۲. ثبت سفارش ─────────────────────────────────────────────
    // total_price و total_amount هر دو ذخیره می‌شوند (سازگاری با track/payment)
    const shippingAddress = [
      customer.province ? `استان ${customer.province}` : "",
      customer.city     ? `شهر ${customer.city}`       : "",
      customer.address  || "",
      customer.postal_code ? `(کدپستی: ${customer.postal_code})` : "",
    ]
      .filter(Boolean)
      .join("، ");

    const orderPayload = {
      id:               orderId,
      order_number:     orderNumber,
      user_id:          userId || null,
      customer_name:    customer.name,
      customer_phone:   cleanPhone,
      shipping_address: shippingAddress,
      items,
      total_price:      amountToman,  // نام اصلی ستون
      total_amount:     amountToman,  // ← فیلد موازی برای سازگاری
      final_amount:     amountToman,  // ← فیلد موازی برای payment verify
      payment_status:   "pending",
      status:           "pending",
      phone_verified:   Boolean(customer.phone_verified),
      created_at:       new Date().toISOString(),
    };

    try {
      const { error } = await supabaseAdmin.from("orders").insert([orderPayload]);
      if (error) console.error("خطا در ثبت سفارش:", error.message);
    } catch (e) {
      console.error("خطای استثناء در ثبت سفارش:", e);
    }

    // ── ۳. کسر موجودی انبار ──────────────────────────────────────
    for (const item of items) {
      if (item.id) {
        try {
          const { data: currentProd } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", item.id)
            .maybeSingle();

          if (currentProd) {
            const newStock = Math.max(0, (currentProd.stock || 0) - (item.quantity || 1));
            await supabaseAdmin
              .from("products")
              .update({ stock: newStock, is_available: newStock > 0 })
              .eq("id", item.id);
          }
        } catch {}
      }
    }

    // ── ۴. ایجاد نشست کاربر ───────────────────────────────────────
    const userSession = {
      id:    userId,
      name:  customer.name,
      phone: cleanPhone,
      role:  "customer",
    };

    const res = NextResponse.json({
      success:  true,
      order_id: orderNumber,
      user:     userSession,
      message:  "✓ سفارش ثبت و حساب کاربری همگام‌سازی شد.",
    });

    res.cookies.set("axon_user_session", JSON.stringify(userSession), {
      httpOnly: false,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30, // ۳۰ روز
      path:     "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور." },
      { status: 500 }
    );
  }
}
