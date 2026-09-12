import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز. لطفا مجددا وارد شوید." }, { status: 401 });
    }

    const [prodsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }),
    ]);

    const products = prodsRes.data || [];
    const orders = ordersRes.data || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyOrders = orders.filter((o) => {
      const orderDate = new Date(o.created_at || Date.now());
      return orderDate >= thirtyDaysAgo && o.status !== "cancelled";
    });

    const productFinancials = products.map((p) => {
      let unitsSoldMonthly = 0;
      let totalRevenueMonthly = 0;

      monthlyOrders.forEach((o) => {
        const items = o.items || [];
        items.forEach((item: any) => {
          if (String(item.productId || item.product_id || item.id) === String(p.id)) {
            const qty = Number(item.quantity || 1);
            unitsSoldMonthly += qty;
            totalRevenueMonthly += Number(item.price || p.price || 0) * qty;
          }
        });
      });

      const sellingPrice = Number(p.discountPrice || p.discount_price || p.price || 0);
      const purchasePrice = Number(p.purchase_price || p.purchasePrice || Math.round(sellingPrice * 0.7));
      const vatPerUnit = Math.round(sellingPrice * 0.1);
      const netSellingRevenuePerUnit = sellingPrice - vatPerUnit;
      const netProfitPerUnit = Math.max(0, netSellingRevenuePerUnit - purchasePrice);

      const totalPurchaseCostMonthly = unitsSoldMonthly * purchasePrice;
      const totalVatMonthly = Math.round(totalRevenueMonthly * 0.1);
      const totalNetProfitMonthly = Math.max(0, (totalRevenueMonthly - totalVatMonthly) - totalPurchaseCostMonthly);
      const profitMarginPercent = sellingPrice > 0 ? Math.round((netProfitPerUnit / sellingPrice) * 100) : 0;

      return {
        id: String(p.id),
        title: p.title || p.name || "کالای بدون عنوان",
        category: p.category || "تجهیزات تخصصی",
        stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
        isAvailable: p.is_available !== false,
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
      totalInventoryAssets: productFinancials.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0),
      totalMonthlySalesGross: productFinancials.reduce((acc, p) => acc + p.totalRevenueMonthly, 0),
      totalMonthlyVAT: productFinancials.reduce((acc, p) => acc + p.totalVatMonthly, 0),
      totalMonthlyNetProfit: productFinancials.reduce((acc, p) => acc + p.totalNetProfitMonthly, 0),
      totalUnitsSold: productFinancials.reduce((acc, p) => acc + p.unitsSoldMonthly, 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      productFinancials,
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
    const newPurchasePrice = purchasePrice !== undefined ? Number(purchasePrice) : (product.purchase_price || 0);

    await supabaseAdmin.from("products").update({
      stock: newStock,
      purchase_price: newPurchasePrice,
      is_available: newStock > 0,
      updated_at: new Date().toISOString(),
    }).eq("id", productId);

    try {
      await supabaseAdmin.from("inventory_logs").insert([{
        id: "log_" + Date.now(),
        product_id: productId,
        product_title: product.title || product.name,
        change_type: Number(stockDelta || 0) >= 0 ? "restock" : "adjustment",
        quantity: Math.abs(Number(stockDelta || 0)),
        cost_price: newPurchasePrice,
        supplier: supplier || "تأمین‌کننده رسمی",
        reference_note: referenceNote || "ثبت سیستمی انبارگردانی",
        created_at: new Date().toISOString(),
      }]);
    } catch {}

    return NextResponse.json({ success: true, message: "تراکنش انبار و بهای خرید در دیتابیس ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
