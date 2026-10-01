// File Path: app/api/accounting/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

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
      supabaseAdmin.from("inventory_logs").select("*").order("created_at", { ascending: false }).limit(80),
    ]);

    const products = prodsRes.data || [];
    const orders = ordersRes.data || [];
    const logs = logsRes.data || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.created_at || Date.now());
      return orderDate >= thirtyDaysAgo && o.status !== "cancelled";
    });

    const productFinancials = products.map((p: any) => {
      let unitsSoldMonthly = 0;
      let totalRevenueMonthly = 0;

      monthlyOrders.forEach((o: any) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          if (String(item.productId || item.product_id || item.id) === String(p.id)) {
            const qty = Number(item.quantity || 1);
            unitsSoldMonthly += qty;
            totalRevenueMonthly += Number(item.discount_price || item.price || p.price || 0) * qty;
          }
        });
      });

      const basePrice = Number(p.price || 0);
      const discountPrice = p.discount_price || p.discountPrice ? Number(p.discount_price || p.discountPrice) : null;
      const sellingPrice = discountPrice && discountPrice > 0 ? discountPrice : basePrice;
      const purchasePrice = Number(p.purchase_price || p.purchasePrice || Math.round(sellingPrice * 0.7));
      const vatPerUnit = Math.round(sellingPrice * 0.1);
      const netSellingRevenuePerUnit = sellingPrice - vatPerUnit;
      const netProfitPerUnit = Math.max(0, netSellingRevenuePerUnit - purchasePrice);

      const totalPurchaseCostMonthly = unitsSoldMonthly * purchasePrice;
      const totalVatMonthly = Math.round(totalRevenueMonthly * 0.1);
      const totalNetProfitMonthly = Math.max(0, totalRevenueMonthly - totalVatMonthly - totalPurchaseCostMonthly);
      const profitMarginPercent = sellingPrice > 0 ? Math.round((netProfitPerUnit / sellingPrice) * 100) : 0;

      return {
        id: String(p.id),
        title: p.title || p.name || "کالای بدون عنوان",
        sku: p.sku || ("SKU-" + String(p.id).slice(-6).toUpperCase()),
        brand: p.brand || "Axon",
        category: p.category || p.category_name || "کالای دیجیتال",
        warranty: p.warranty || "۱۸ ماه گارانتی اصالت طلایی",
        stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
        isAvailable: p.is_available !== false,
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
      };
    });

    const summary = {
      totalInventoryAssets: productFinancials.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0),
      totalMonthlySalesGross: productFinancials.reduce((acc, p) => acc + p.totalRevenueMonthly, 0),
      totalMonthlyVAT: productFinancials.reduce((acc, p) => acc + p.totalVatMonthly, 0),
      totalMonthlyNetProfit: productFinancials.reduce((acc, p) => acc + p.totalNetProfitMonthly, 0),
      totalUnitsSold: productFinancials.reduce((acc, p) => acc + p.unitsSoldMonthly, 0),
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
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { data: product } = await supabaseAdmin.from("products").select("*").eq("id", productId).single();
    if (!product) {
      return NextResponse.json({ success: false, message: "کالا یافت نشد." }, { status: 404 });
    }

    const currentStock = Number(product.stock || 0);
    const newStock = Math.max(0, currentStock + Number(stockDelta || 0));
    const newPurchasePrice =
      purchasePrice !== undefined && purchasePrice !== "" ? Number(purchasePrice) : Number(product.purchase_price || 0);

    await supabaseAdmin
      .from("products")
      .update({
        stock: newStock,
        purchase_price: newPurchasePrice,
        is_available: newStock > 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    try {
      await supabaseAdmin.from("inventory_logs").insert([
        {
          id: "log_" + Date.now(),
          product_id: String(productId),
          product_title: product.title || product.name,
          change_type: Number(stockDelta || 0) >= 0 ? "restock" : "adjustment",
          quantity: Math.abs(Number(stockDelta || 0)),
          cost_price: newPurchasePrice,
          supplier: supplier || "تأمین‌کننده رسمی",
          reference_note: referenceNote || "ثبت سیستمی انبارگردانی",
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
    } = body;

    if (!id || !title) {
      return NextResponse.json({ success: false, message: "شناسه و عنوان کالا الزامی است." }, { status: 400 });
    }

    const numericStock = Math.max(0, Number(stock ?? 0));
    const updatePayload: Record<string, any> = {
      title: String(title).trim(),
      name: String(title).trim(),
      category: category ? String(category).trim() : "کالای دیجیتال",
      sku: sku ? String(sku).trim() : undefined,
      brand: brand ? String(brand).trim() : undefined,
      warranty: warranty ? String(warranty).trim() : "۱۸ ماه گارانتی اصالت طلایی",
      price: Math.max(0, Number(basePrice ?? 0)),
      discount_price: discountPrice && Number(discountPrice) > 0 ? Number(discountPrice) : null,
      purchase_price: Math.max(0, Number(purchasePrice ?? 0)),
      stock: numericStock,
      is_available: isAvailable !== undefined ? Boolean(isAvailable) : numericStock > 0,
      updated_at: new Date().toISOString(),
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
          cost_price: updatePayload.purchase_price,
          supplier: "ویرایش مستقیم حسابداری و انبار",
          reference_note: "بروزرسانی کامل مشخصات، قیمت فروش، بهای خرید و موجودی کالا",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      product: updated,
      message: "✓ تمامی مشخصات، قیمت‌ها و موجودی کالا با موفقیت در دیتابیس ویرایش شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
