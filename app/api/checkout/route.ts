// File Path: app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyPhoneTokenSignature } from "@/app/api/send-otp/route";
import { verifyCustomerToken, CUSTOMER_COOKIE_NAME } from "@/lib/customerSession";
import { normalizeSystemSettings } from "@/lib/systemSettings";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { logAuditEvent } from "@/lib/auditLogger";
import { sendTextSMS } from "@/lib/otpService";
import { releaseExpiredPendingOrders } from "@/lib/inventoryReleaser";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded
    ? forwarded.split(",")[0].trim()
    : req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    // آزادسازی فوری سفارش‌های پرداخت‌نشده منقضی پیش از کنترل موجودی انبار
    await releaseExpiredPendingOrders({
      maxAgeMinutes: 15,
      bypassThrottle: true,
    });

    const body = await req.json();
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const requestedUseWallet = Boolean(body.useWallet);

    const fullName = String(
      customer.fullName || body.customer_name || "خریدار محترم"
    ).trim();
    const cleanPhone = String(customer.phone || body.phone || "")
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/\D/g, "");
    const province = String(
      customer.province || body.province || ""
    ).trim();
    const city = String(customer.city || body.city || "").trim();
    const address = String(customer.address || body.address || "").trim();
    const postalCode = String(
      customer.postalCode || body.postal_code || ""
    ).replace(/\D/g, "");
    const notes = String(customer.notes || body.notes || "").trim();

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "شماره موبایل ۱۱ رقمی معتبر الزامی است." },
        { status: 400 }
      );
    }

    if (!address || address.length < 5) {
      return NextResponse.json(
        { success: false, message: "وارد کردن نشانی دقیق پستی الزامی است." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: "سبد خرید شما خالی است." },
        { status: 400 }
      );
    }

    const siteRow = await getMasterSiteInfoRow();
    const sysRules = normalizeSystemSettings(
      siteRow?.homepage_layout_config,
      siteRow
    );
    const storeDomain = (
      sysRules.canonicalBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://axoncore.ir"
    )
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");

    if (sysRules.maintenanceMode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فروشگاه موقتاً در حالت تعمیرات و بروزرسانی است و امکان ثبت سفارش وجود ندارد.",
        },
        { status: 503 }
      );
    }

    const otpTokenFromBody = String(body.otpVerificationToken || "").trim();
    const otpTokenFromCookie =
      req.cookies.get("axon_verified_phone_token")?.value || "";
    const customerSessionCookie =
      req.cookies.get(CUSTOMER_COOKIE_NAME)?.value || "";

    let isCustomerLoggedIn = false;
    if (customerSessionCookie) {
      const custSession = await verifyCustomerToken(customerSessionCookie);
      if (
        custSession &&
        String(custSession.phone).replace(/\D/g, "") === cleanPhone
      ) {
        isCustomerLoggedIn = true;
      }
    }

    if (!sysRules.allowGuestCheckout && !isCustomerLoggedIn) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ثبت سفارش مهمان در حال حاضر غیرفعال است. لطفاً ابتدا وارد حساب کاربری خود شوید.",
        },
        { status: 403 }
      );
    }

    const isPhoneCryptographicallyVerified =
      isCustomerLoggedIn ||
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromBody) ||
      verifyPhoneTokenSignature(cleanPhone, otpTokenFromCookie);

    if (!isPhoneCryptographicallyVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره تلفن همراه شما هنوز از طریق کد پیامکی تایید نشده است.",
        },
        { status: 403 }
      );
    }

    const couponCode = body.couponCode
      ? String(body.couponCode).trim().toUpperCase()
      : null;
    const clientIp = getClientIp(req);
    const userIdentifier = cleanPhone || clientIp;

    if (couponCode) {
      const { data: previousOrders, error: orderCheckError } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("coupon_code", couponCode)
        .eq("phone", cleanPhone)
        .neq("status", "cancelled")
        .limit(1);

      if (!orderCheckError && previousOrders && previousOrders.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "شما با این شماره موبایل پیش از این از کد تخفیف وارد شده استفاده کرده‌اید.",
          },
          { status: 403 }
        );
      }
    }

    const productIds = Array.from(
      new Set(
        items
          .map((it: any) =>
            String(it.id || it.productId || it.product_id || "").trim()
          )
          .filter(Boolean)
      )
    );

    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "اقلام سبد خرید معتبر نیستند." },
        { status: 400 }
      );
    }

    const { data: dbProducts } = await supabaseAdmin
      .from("products")
      .select(
        "id, title, name, price, discount_price, purchase_price, stock, is_available, category, shipping_type"
      )
      .in("id", productIds);

    const dbProdMap = new Map<string, any>();
    (dbProducts || []).forEach((p: any) => dbProdMap.set(String(p.id), p));

    let verifiedSubtotal = 0;
    const verifiedItems: any[] = [];
    let requiresTipaxOnly = false;
    let requiresPostOnly = false;

    for (const item of items) {
      const prodId = String(
        item.id || item.productId || item.product_id || ""
      ).trim();
      const qty = Math.max(1, Math.min(99, Number(item.quantity || 1)));
      const dbProd = prodId ? dbProdMap.get(prodId) : null;

      if (!dbProd) {
        return NextResponse.json(
          {
            success: false,
            message:
              "یکی از کالاهای سبد خرید در کاتالوگ فروشگاه یافت نشد یا حذف شده است. لطفاً سبد خرید را بروزرسانی کنید.",
          },
          { status: 400 }
        );
      }

      const availableStock =
        dbProd.stock !== undefined && dbProd.stock !== null
          ? Number(dbProd.stock)
          : 0;
      if (dbProd.is_available === false || availableStock < qty) {
        return NextResponse.json(
          {
            success: false,
            message:
              "موجودی کالای «" +
              (dbProd.title || dbProd.name || item.title) +
              "» در انبار کافی نیست (موجودی فعلی: " +
              Math.max(0, availableStock) +
              " عدد).",
          },
          { status: 400 }
        );
      }

      const shipType = String(dbProd.shipping_type || "both")
        .toLowerCase()
        .trim();
      if (shipType === "tipax") requiresTipaxOnly = true;
      if (shipType === "post") requiresPostOnly = true;

      const dbDiscount = Number(dbProd.discount_price || 0);
      const dbRegular = Number(dbProd.price || 0);
      const unitPrice =
        dbDiscount > 0 && dbDiscount < dbRegular ? dbDiscount : dbRegular;

      verifiedSubtotal += unitPrice * qty;
      verifiedItems.push({
        id: String(dbProd.id),
        productId: String(dbProd.id),
        title: dbProd.title || dbProd.name || item.title,
        quantity: qty,
        price: unitPrice,
        category: dbProd.category,
        selectedColor: item.selectedColor || undefined,
      });
    }

    const rawShippingMethod = String(
      body.shippingMethod ||
        (address.includes("[ارسال با تیپاکس]") ? "tipax" : "post")
    )
      .toLowerCase()
      .trim();

    let resolvedShippingMethod: "post" | "tipax" =
      rawShippingMethod === "tipax" ? "tipax" : "post";

    if (requiresTipaxOnly && !requiresPostOnly) {
      resolvedShippingMethod = "tipax";
    } else if (requiresPostOnly && !requiresTipaxOnly) {
      resolvedShippingMethod = "post";
    }

    let verifiedDiscount = 0;
    let validCouponRow: any = null;

    if (couponCode) {
      const { data: couponRow } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .ilike("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      const nowMs = Date.now();
      const notStarted =
        couponRow?.starts_at &&
        new Date(couponRow.starts_at).getTime() > nowMs;
      const isExpired =
        couponRow?.expires_at &&
        new Date(couponRow.expires_at).getTime() < nowMs;
      const limitReached =
        couponRow?.usage_limit &&
        Number(couponRow.usage_limit) > 0 &&
        Number(couponRow.times_used ?? couponRow.used_count ?? 0) >=
          Number(couponRow.usage_limit);
      const minSpend = Number(
        couponRow?.min_order_amount ?? couponRow?.min_purchase ?? 0
      );

      if (
        couponRow &&
        !notStarted &&
        !isExpired &&
        !limitReached &&
        verifiedSubtotal >= minSpend
      ) {
        let targetSubtotal = verifiedSubtotal;
        if (couponRow.target_type === "category" && couponRow.target_id) {
          const matching = verifiedItems.filter(
            (vi) => String(vi.category) === String(couponRow.target_id)
          );
          targetSubtotal = matching.reduce(
            (acc, vi) => acc + vi.price * vi.quantity,
            0
          );
        } else if (couponRow.target_type === "product" && couponRow.target_id) {
          const matching = verifiedItems.filter(
            (vi) => String(vi.id || vi.productId) === String(couponRow.target_id)
          );
          targetSubtotal = matching.reduce(
            (acc, vi) => acc + vi.price * vi.quantity,
            0
          );
        }

        if (targetSubtotal > 0) {
          validCouponRow = couponRow;
          const dtype = String(
            couponRow.discount_type || couponRow.type || "percent"
          );
          const dval = Number(
            couponRow.discount_value ??
              couponRow.value ??
              couponRow.discount_percent ??
              couponRow.discount_amount ??
              0
          );
          if (dtype === "percent") {
            verifiedDiscount = Math.round((targetSubtotal * dval) / 100);
            const maxDisc = Number(
              couponRow.max_discount || couponRow.max_discount_amount || 0
            );
            if (maxDisc > 0 && verifiedDiscount > maxDisc) {
              verifiedDiscount = maxDisc;
            }
          } else {
            verifiedDiscount = Math.min(targetSubtotal, dval);
          }
        }
      }
    }

    const afterDiscount = Math.max(0, verifiedSubtotal - verifiedDiscount);

    const qualifiesForFreeShipping =
      sysRules.freeShippingThreshold > 0 &&
      afterDiscount >= sysRules.freeShippingThreshold;

    let shippingCost = 0;
    if (afterDiscount > 0 && !qualifiesForFreeShipping) {
      if (resolvedShippingMethod === "post") {
        shippingCost = Number(sysRules.postShippingCost || 0);
      } else {
        shippingCost = 0;
      }
    }

    const vatPercent = sysRules.vatPercent;
    const vatAmount =
      afterDiscount > 0 && vatPercent > 0
        ? Math.round((afterDiscount * vatPercent) / 100)
        : 0;

    const grandTotalBeforeWallet = Math.max(
      0,
      afterDiscount + vatAmount + shippingCost
    );

    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentDuplicate } = await supabaseAdmin
      .from("orders")
      .select("id, final_amount, tracking_code, order_number, status")
      .eq("phone", cleanPhone)
      .in("status", ["pending", "paid"])
      .gte("created_at", twoMinsAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate) {
      return NextResponse.json({
        success: true,
        paidByWallet: recentDuplicate.status === "paid",
        order: recentDuplicate,
        message: "✓ سفارش شما پیش از این ثبت شده است.",
      });
    }

    let walletUsedAmount = 0;
    let prevWalletBalance = 0;
    let finalAmount = grandTotalBeforeWallet;

    if (requestedUseWallet && grandTotalBeforeWallet > 0) {
      try {
        const { data: walletRow } = await supabaseAdmin
          .from("customer_wallets")
          .select("balance")
          .eq("customer_phone", cleanPhone)
          .maybeSingle();

        prevWalletBalance = Math.max(0, Number(walletRow?.balance || 0));
        if (prevWalletBalance > 0) {
          walletUsedAmount = Math.min(prevWalletBalance, grandTotalBeforeWallet);
          finalAmount = Math.max(0, grandTotalBeforeWallet - walletUsedAmount);

          if (
            finalAmount > 0 &&
            finalAmount < 1000 &&
            grandTotalBeforeWallet >= 1000
          ) {
            finalAmount = 1000;
            walletUsedAmount = Math.max(0, grandTotalBeforeWallet - 1000);
          }

          const nextWalletBalance = Math.max(
            0,
            prevWalletBalance - walletUsedAmount
          );
          await supabaseAdmin
            .from("customer_wallets")
            .update({
              balance: nextWalletBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("customer_phone", cleanPhone);
        }
      } catch (walletErr) {
        console.error("Wallet deduction error:", walletErr);
      }
    }

    if (finalAmount > 0 && finalAmount < 1000) {
      finalAmount = 1000;
    }

    const isPaidFullyByWallet =
      walletUsedAmount > 0 && finalAmount === 0;

    const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
    const orderNumber = "AXN-" + shortCode;
    const trackingCode =
      "TRK-" + Date.now().toString().slice(-6) + "-" + shortCode.slice(0, 3);
    const walletNoteSuffix =
      walletUsedAmount > 0
        ? ` [کسر از کیف پول: ${walletUsedAmount.toLocaleString("fa-IR")} تومان]`
        : "";
    const locationPrefix = [province, city].filter(Boolean).join("، ");
    const fullAddress =
      (locationPrefix ? `${locationPrefix} — ` : "") +
      address +
      (notes ? " (" + notes + ")" : "") +
      walletNoteSuffix;

    const generatedUuid = randomUUID();
    const orderPayload: Record<string, any> = {
      id: generatedUuid,
      order_number: orderNumber,
      customer_name: fullName,
      phone: cleanPhone,
      province,
      city,
      address: fullAddress,
      postal_code: postalCode || null,
      items: verifiedItems,
      total_amount: verifiedSubtotal,
      discount_amount: verifiedDiscount,
      vat_percent: vatPercent,
      vat_amount: vatAmount,
      shipping_cost: shippingCost,
      final_amount: finalAmount,
      coupon_code: validCouponRow ? validCouponRow.code : null,
      user_identifier: userIdentifier,
      status: isPaidFullyByWallet ? "paid" : "pending",
      payment_status: isPaidFullyByWallet ? "paid" : "pending",
      tracking_code: trackingCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let savedOrder: any = null;
    const { data: insertedOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert([orderPayload])
      .select()
      .maybeSingle();

    if (!orderErr && insertedOrder) {
      savedOrder = insertedOrder;
    } else {
      const minimalOrder: Record<string, any> = {
        id: generatedUuid,
        customer_name: fullName,
        phone: cleanPhone,
        address: fullAddress,
        items: verifiedItems,
        total_amount: verifiedSubtotal,
        final_amount: finalAmount,
        status: isPaidFullyByWallet ? "paid" : "pending",
        tracking_code: trackingCode,
        created_at: new Date().toISOString(),
      };
      const { data: minInserted, error: minErr } = await supabaseAdmin
        .from("orders")
        .insert([minimalOrder])
        .select()
        .maybeSingle();

      if (!minErr && minInserted) {
        savedOrder = minInserted;
      } else {
        if (walletUsedAmount > 0) {
          await supabaseAdmin
            .from("customer_wallets")
            .update({
              balance: prevWalletBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("customer_phone", cleanPhone);
        }
        throw new Error(
          minErr?.message || orderErr?.message || "خطا در ذخیره سفارش در دیتابیس."
        );
      }
    }

    if (savedOrder && validCouponRow) {
      try {
        const currentUsed = Number(
          validCouponRow.times_used ?? validCouponRow.used_count ?? 0
        );
        await supabaseAdmin
          .from("coupons")
          .update({
            times_used: currentUsed + 1,
            used_count: currentUsed + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", validCouponRow.id);
      } catch (e) {
        console.error("Failed to update coupon usage:", e);
      }
    }

    for (const item of verifiedItems) {
      const prodId = String(item.id || item.productId || "");
      const qty = Math.max(1, Number(item.quantity || 1));
      const prodRow = prodId ? dbProdMap.get(prodId) : null;
      if (!prodRow) continue;

      try {
        const currentStock = Number(prodRow.stock ?? 0);
        const nextStock = Math.max(0, currentStock - qty);
        await supabaseAdmin
          .from("products")
          .update({
            stock: nextStock,
            is_available: nextStock > 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prodRow.id);

        await supabaseAdmin.from("inventory_logs").insert([
          {
            id:
              "sale_" +
              Date.now() +
              "_" +
              Math.random().toString(36).slice(2, 5),
            product_id: String(prodRow.id),
            product_title: prodRow.title || prodRow.name || item.title,
            change_type: "sale",
            quantity: qty,
            cost_price: Number(
              prodRow.purchase_price ||
                Math.round(Number(prodRow.price || 0) * 0.7)
            ),
            supplier: "فروش آنلاین سایت",
            reference_note: "کسر خودکار بابت فاکتور " + orderNumber,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {}
    }

    try {
      await supabaseAdmin.from("crm_customers").upsert([
        {
          id: "cust_" + cleanPhone,
          full_name: fullName,
          phone: cleanPhone,
          province,
          city,
          address: fullAddress,
          postal_code: postalCode || null,
          lifecycle_stage: "active",
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    if (isPaidFullyByWallet) {
      try {
        await sendTextSMS(
          cleanPhone,
          `${fullName} عزیز، سفارش شما به شماره ${orderNumber} از طریق اعتبار کیف پول تسویه و ثبت شد. کد رهگیری: ${trackingCode} | ${storeDomain}`
        );
      } catch {}
    }

    await logAuditEvent({
      action: "CREATE_CUSTOMER_ORDER",
      target_resource: "orders:" + orderNumber,
      target_id: String(savedOrder.id),
      admin_username: "customer:" + cleanPhone,
      ip_address: clientIp,
      details: {
        orderNumber,
        finalAmount,
        walletUsedAmount,
        isPaidFullyByWallet,
        shippingMethod: resolvedShippingMethod,
        shippingCost,
        vatAmount,
        couponCode: validCouponRow?.code || null,
      },
    });

    return NextResponse.json({
      success: true,
      paidByWallet: isPaidFullyByWallet,
      walletUsed: walletUsedAmount,
      message: isPaidFullyByWallet
        ? "✓ سفارش شما با اعتبار کیف پول با موفقیت پرداخت و ثبت شد."
        : "سفارش با موفقیت ثبت گردید.",
      order: {
        ...savedOrder,
        order_number: orderNumber,
        subtotal: verifiedSubtotal,
        discount_amount: verifiedDiscount,
        vat_percent: vatPercent,
        vat_amount: vatAmount,
        shipping_cost: shippingCost,
        final_amount: finalAmount,
        tracking_code: savedOrder.tracking_code || trackingCode,
      },
      orderId: savedOrder.id,
      orderNumber: savedOrder.order_number || orderNumber,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطا در ثبت سفارش." },
      { status: 500 }
    );
  }
}