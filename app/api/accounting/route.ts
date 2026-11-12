// File Path: app/api/accounting/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { unpackProductRow, packProductDescription } from "@/lib/productUnpacker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const [prodsRes, ordersRes, logsRes] = await Promise.all([
      supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("inventory_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const products = (prodsRes.data || []).map(unpackProductRow);
    const orders = ordersRes.data || [];
    const logs = logsRes.data || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // فقط سفارش‌های تاییدشده و غیرلغوشده در ۳۰ روز اخیر در سود قطعی ماهانه لحاظ می‌شوند
    const monthlyOrders = orders.filter(
      (o: {
        created_at?: string;
        status?: string;
        payment_status?: string;
        items?: Array<{
          productId?: string;
          product_id?: string;
          id?: string;
          quantity?: number;
          discount_price?: number;
          price?: number;
        }>;
      }) => {
        const orderDate = new Date(o.created_at || Date.now());
        if (orderDate < thirtyDaysAgo) return false;
        const st = String(o.status || "").toLowerCase();
        const pst = String(o.payment_status || "").toLowerCase();
        if (st === "cancelled" || pst === "failed" || pst === "cancelled") return false;
        return (
          ["paid", "processing", "shipped", "delivered"].includes(st) || pst === "paid"
        );
      }
    );

    const productFinancials = products.map((p: any) => {
      let unitsSoldMonthly = 0;
      let totalRevenueMonthly = 0;

      const basePrice = Math.max(0, Number(p.price || 0));
      const discountPrice =
        p.discount_price !== undefined &&
        p.discount_price !== null &&
        Number(p.discount_price) > 0 &&
        (basePrice === 0 || Number(p.discount_price) < basePrice)
          ? Number(p.discount_price)
          : null;
      const sellingPrice = discountPrice !== null ? discountPrice : basePrice;

      monthlyOrders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          if (String(item.productId || item.product_id || item.id) === String(p.id)) {
            const qty = Math.max(1, Number(item.quantity || 1));
            unitsSoldMonthly += qty;
            const unitSoldPrice = Number(
              item.discount_price || item.unit_price || item.price || sellingPrice || 0
            );
            totalRevenueMonthly += unitSoldPrice * qty;
          }
        });
      });

      const purchasePrice =
        p.purchase_price !== undefined && p.purchase_price !== null && Number(p.purchase_price) >= 0
          ? Number(p.purchase_price)
          : sellingPrice > 0
          ? Math.round(sellingPrice * 0.7)
          : 0;

      const vatPerUnit = sellingPrice > 0 ? Math.round(sellingPrice * 0.1) : 0;
      const netSellingRevenuePerUnit = Math.max(0, sellingPrice - vatPerUnit);
      const netProfitPerUnit =
        sellingPrice > 0 ? Math.max(0, netSellingRevenuePerUnit - purchasePrice) : 0;

      const totalPurchaseCostMonthly = unitsSoldMonthly * purchasePrice;
      const totalVatMonthly = Math.round(totalRevenueMonthly * 0.1);
      const totalNetProfitMonthly = Math.max(
        0,
        totalRevenueMonthly - totalVatMonthly - totalPurchaseCostMonthly
      );
      const profitMarginPercent =
        sellingPrice > 0 ? Math.round((netProfitPerUnit / sellingPrice) * 100) : 0;

      return {
        id: String(p.id),
        title: p.title || "کالای بدون عنوان",
        sku: p.sku || "SKU-" + String(p.id).slice(-6).toUpperCase(),
        brand: p.brand || "",
        category: p.category || "کالای دیجیتال",
        warranty: p.warranty || "",
        stock: Math.max(0, Number(p.stock ?? 0)),
        isAvailable: p.is_available !== false && Number(p.stock ?? 0) > 0,
        basePrice,
        discountPrice,
        sellingPrice,
        purchasePrice,
        vatPerUnit,
        netProfitPerUnit,
        profitMarginPercent,
        unitsSoldMonthly,
        totalRevenueMonthly,
        totalPurchaseCostMonthly,
        totalVatMonthly,
        totalNetProfitMonthly,
        shipping_type: p.shipping_type || "both",
        color_options: Array.isArray(p.color_options) ? p.color_options : [],
      };
    });

    const summary = {
      totalInventoryAssets: productFinancials.reduce(
        (acc: number, p: any) => acc + p.stock * p.purchasePrice,
        0
      ),
      totalMonthlySalesGross: productFinancials.reduce(
        (acc: number, p: any) => acc + p.totalRevenueMonthly,
        0
      ),
      totalMonthlyVAT: productFinancials.reduce(
        (acc: number, p: any) => acc + p.totalVatMonthly,
        0
      ),
      totalMonthlyNetProfit: productFinancials.reduce(
        (acc: number, p: any) => acc + p.totalNetProfitMonthly,
        0
      ),
      totalUnitsSold: productFinancials.reduce(
        (acc: number, p: any) => acc + p.unitsSoldMonthly,
        0
      ),
      totalOrdersMonthlyCount: monthlyOrders.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      productFinancials,
      inventoryLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { productId, purchasePrice, stockDelta, supplier, referenceNote } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "شناسه کالا الزامی است." },
        { status: 400 }
      );
    }

    const { data: rawProd } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (!rawProd) {
      return NextResponse.json({ success: false, message: "کالا یافت نشد." }, { status: 404 });
    }

    const product = unpackProductRow(rawProd);
    const currentStock = Math.max(0, Number(product.stock || 0));
    const deltaNum = Number(stockDelta || 0);
    const newStock = Math.max(0, currentStock + deltaNum);
    const newPurchasePrice =
      purchasePrice !== undefined && purchasePrice !== "" && Number(purchasePrice) >= 0
        ? Number(purchasePrice)
        : Number(product.purchase_price || 0);

    const updatedMeta = {
      images: product.images || [product.image || "/placeholder.png"],
      specs: product.specs || {},
      warranty: product.warranty ?? "",
      sku: product.sku,
      brand: product.brand ?? "",
      purchase_price: newPurchasePrice,
      discount_price: product.discount_price ?? null,
      color_options: Array.isArray(product.color_options) ? product.color_options : [],
      meta_title: product.meta_title || product.title,
      meta_description: product.meta_description || "",
      short_description: product.short_description || "",
    };

    const packagedDesc = packProductDescription(product.description || "", updatedMeta);

    const { error: upErr } = await supabaseAdmin
      .from("products")
      .update({
        stock: newStock,
        is_available: newStock > 0,
        purchase_price: newPurchasePrice,
        description: packagedDesc,
        updated_at: new Date().toISOString(),
        /* Enterprise Infrastructure Inject */
        discount_start_date:
          typeof body !== "undefined" && body.discount_start_date
            ? new Date(body.discount_start_date).toISOString()
            : undefined,
        discount_end_date:
          typeof body !== "undefined" && body.discount_end_date
            ? new Date(body.discount_end_date).toISOString()
            : undefined,
        media_gallery:
          typeof body !== "undefined" && Array.isArray(body.media_gallery)
            ? body.media_gallery
            : undefined,
        specs_jsonb:
          typeof body !== "undefined" && typeof body.specs === "object"
            ? body.specs
            : undefined,
      })
      .eq("id", productId);

    if (upErr) throw upErr;

    try {
      await supabaseAdmin.from("inventory_logs").insert([
        {
          id: "log_" + Date.now(),
          product_id: String(productId),
          product_title: product.title,
          change_type: deltaNum >= 0 ? "restock" : "adjustment",
          quantity: Math.abs(deltaNum),
          cost_price: newPurchasePrice,
          supplier: supplier || "تأمین‌کننده رسمی",
          reference_note:
            referenceNote ||
            (deltaNum >= 0
              ? `افزایش موجودی (${currentStock} ← ${newStock})`
              : `کاهش/اصلاح موجودی (${currentStock} ← ${newStock})`),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "✓ تراکنش انبار و بهای خرید با موفقیت در دیتابیس ذخیره شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      category,
      sku,
      brand,
      warranty,
      basePrice,
      discountPrice,
      purchasePrice,
      stock,
      isAvailable,
      shipping_type,
    } = body;

    if (!id || !String(title || "").trim()) {
      return NextResponse.json(
        { success: false, message: "شناسه و عنوان کالا الزامی است." },
        { status: 400 }
      );
    }

    const { data: rawExisting } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!rawExisting) {
      return NextResponse.json(
        { success: false, message: "کالای مورد نظر در دیتابیس یافت نشد." },
        { status: 404 }
      );
    }

    const unpackedExisting = unpackProductRow(rawExisting);

    const cleanTitle = String(title).trim();
    const numericStock = Math.max(0, Number(stock ?? 0));
    const cleanBasePrice = Math.max(0, Number(basePrice ?? 0));
    const rawDiscount =
      discountPrice !== undefined && discountPrice !== null && Number(discountPrice) > 0
        ? Number(discountPrice)
        : null;

    // قیمت تخفیف فقط زمانی معتبر است که کمتر از قیمت فروش پایه باشد
    const cleanDiscount =
      rawDiscount !== null && (cleanBasePrice === 0 || rawDiscount < cleanBasePrice)
        ? rawDiscount
        : null;

    const cleanPurchase = Math.max(
      0,
      Number(purchasePrice ?? unpackedExisting.purchase_price ?? 0)
    );

    const cleanBrand =
      brand !== undefined
        ? String(brand).replace(/[\u200B-\u200D\uFEFF]/g, "").trim()
        : unpackedExisting.brand || "";

    const cleanWarranty =
      warranty !== undefined
        ? String(warranty).replace(/[\u200B-\u200D\uFEFF]/g, "").trim()
        : unpackedExisting.warranty || "";

    const cleanSku =
      sku !== undefined && String(sku).trim()
        ? String(sku).trim()
        : unpackedExisting.sku;

    const updatedMeta = {
      images: unpackedExisting.images || [unpackedExisting.image || "/placeholder.png"],
      specs: unpackedExisting.specs || {},
      warranty: cleanWarranty,
      sku: cleanSku,
      brand: cleanBrand,
      purchase_price: cleanPurchase,
      discount_price: cleanDiscount,
      color_options: Array.isArray(unpackedExisting.color_options)
        ? unpackedExisting.color_options
        : [],
      meta_title: unpackedExisting.meta_title || cleanTitle,
      meta_description: unpackedExisting.meta_description || "",
      short_description: unpackedExisting.short_description || "",
    };

    const packagedDesc = packProductDescription(
      unpackedExisting.description || "",
      updatedMeta
    );

    const updatePayload: Record<string, any> = {
      title: cleanTitle,
      name: cleanTitle,
      category: category ? String(category).trim() : unpackedExisting.category || "کالای دیجیتال",
      price: cleanBasePrice,
      discount_price: cleanDiscount,
      purchase_price: cleanPurchase,
      stock: numericStock,
      is_available: isAvailable !== undefined ? Boolean(isAvailable) : numericStock > 0,
      description: packagedDesc,
      shipping_type: shipping_type || unpackedExisting.shipping_type || "both",
      updated_at: new Date().toISOString(),
      /* Enterprise Infrastructure Inject */
      discount_start_date:
        typeof body !== "undefined" && body.discount_start_date
          ? new Date(body.discount_start_date).toISOString()
          : undefined,
      discount_end_date:
        typeof body !== "undefined" && body.discount_end_date
          ? new Date(body.discount_end_date).toISOString()
          : undefined,
      media_gallery:
        typeof body !== "undefined" && Array.isArray(body.media_gallery)
          ? body.media_gallery
          : undefined,
      specs_jsonb:
        typeof body !== "undefined" && typeof body.specs === "object"
          ? body.specs
          : undefined,
    };

    const { data: updated, error } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabaseAdmin.from("inventory_logs").insert([
        {
          id: "edit_" + Date.now(),
          product_id: String(id),
          product_title: updatePayload.title,
          change_type: "edit_product",
          quantity: numericStock,
          cost_price: cleanPurchase,
          supplier: "ویرایش مستقیم حسابداری و انبار",
          reference_note: `بروزرسانی کالا (فروش: ${cleanBasePrice.toLocaleString(
            "fa-IR"
          )} ت | خرید: ${cleanPurchase.toLocaleString("fa-IR")} ت | موجودی: ${numericStock})`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      product: unpackProductRow(updated),
      message: "✓ تمامی مشخصات، قیمت‌ها و موجودی کالا با موفقیت در دیتابیس ویرایش شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}