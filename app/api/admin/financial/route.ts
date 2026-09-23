import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get("type") || "monthly";
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  try {
    if (type === "monthly") {
      // ── گزارش مالی ماهانه ──────────────────────────────────
      const [year, mon] = month.split("-").map(Number);
      const startDate   = new Date(year, mon - 1, 1).toISOString();
      const endDate     = new Date(year, mon, 1).toISOString();

      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id,order_number,customer_name,customer_phone,total_price,total_amount,final_amount,payment_status,status,items,created_at")
        .gte("created_at", startDate)
        .lt("created_at", endDate)
        .order("created_at", { ascending: true });

      const all       = orders || [];
      const paid      = all.filter(o => ["paid","delivered","shipped"].includes(o.payment_status || o.status || ""));
      const cancelled = all.filter(o => (o.payment_status || o.status) === "cancelled");

      const totalRevenue  = paid.reduce((s, o) => s + Number(o.final_amount || o.total_amount || o.total_price || 0), 0);
      const avgOrder      = paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0;

      // تجمیع روزانه
      const dailyMap: Record<string, number> = {};
      paid.forEach(o => {
        const day = o.created_at.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + Number(o.final_amount || o.total_amount || o.total_price || 0);
      });
      const dailyRevenue = Object.entries(dailyMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // پرفروش‌ترین محصولات
      const productSales: Record<string, { title: string; qty: number; revenue: number }> = {};
      paid.forEach(o => {
        (o.items || []).forEach((item: any) => {
          const key = item.id || item.title;
          if (!productSales[key]) productSales[key] = { title: item.title || "—", qty: 0, revenue: 0 };
          productSales[key].qty     += Number(item.quantity || 1);
          productSales[key].revenue += Number((item.discountPrice || item.price || 0)) * Number(item.quantity || 1);
        });
      });
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        month,
        stats: {
          totalOrders:    all.length,
          paidOrders:     paid.length,
          cancelledOrders:cancelled.length,
          pendingOrders:  all.length - paid.length - cancelled.length,
          totalRevenue,
          avgOrder,
          successRate:    all.length > 0 ? Math.round((paid.length / all.length) * 100) : 0,
        },
        dailyRevenue,
        topProducts,
        orders: all,
      });
    }

    if (type === "inventory") {
      // ── آمار انبار ──────────────────────────────────────────
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id,title,category,price,stock,image_url,created_at")
        .order("stock", { ascending: true });

      const all = products || [];
      const totalValue = all.reduce((s, p) => s + Number(p.price || 0) * Number(p.stock || 0), 0);

      return NextResponse.json({
        success: true,
        products: all,
        stats: {
          totalProducts:  all.length,
          inStock:        all.filter(p => Number(p.stock) > 0).length,
          outOfStock:     all.filter(p => Number(p.stock) === 0).length,
          lowStock:       all.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 3).length,
          totalInventoryValue: totalValue,
        },
      });
    }

    if (type === "customers") {
      // ── مشتریان CRM ──────────────────────────────────────────
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("customer_name,customer_phone,total_price,total_amount,final_amount,payment_status,status,created_at,order_number")
        .order("created_at", { ascending: false });

      const customerMap: Record<string, any> = {};
      (orders || []).forEach(o => {
        const phone = o.customer_phone || "unknown";
        if (!customerMap[phone]) {
          customerMap[phone] = {
            phone,
            name:         o.customer_name || "نامشخص",
            totalOrders:  0,
            paidOrders:   0,
            totalSpent:   0,
            lastOrderAt:  o.created_at,
            firstOrderAt: o.created_at,
          };
        }
        const c = customerMap[phone];
        c.totalOrders++;
        if (["paid","delivered","shipped"].includes(o.payment_status || o.status || "")) {
          c.paidOrders++;
          c.totalSpent += Number(o.final_amount || o.total_amount || o.total_price || 0);
        }
        if (o.created_at > c.lastOrderAt)  c.lastOrderAt  = o.created_at;
        if (o.created_at < c.firstOrderAt) c.firstOrderAt = o.created_at;
      });

      const customers = Object.values(customerMap)
        .map((c: any) => ({ ...c, isVip: c.totalSpent >= 5_000_000 }))
        .sort((a: any, b: any) => b.totalSpent - a.totalSpent);

      return NextResponse.json({ success: true, customers });
    }

    return NextResponse.json({ success: false, message: "type نامعتبر" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH: بروزرسانی موجودی انبار (با تایید) ─────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { productId, addStock, newStock } = await req.json();
    if (!productId) return NextResponse.json({ success: false, message: "productId الزامی است" }, { status: 400 });

    const { data: current } = await supabaseAdmin.from("products").select("stock,title").eq("id", productId).single();
    const finalStock = newStock !== undefined ? Number(newStock) : (Number(current?.stock || 0) + Number(addStock || 0));

    const { error } = await supabaseAdmin
      .from("products")
      .update({ stock: Math.max(0, finalStock), is_available: finalStock > 0 })
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ success: true, newStock: finalStock, message: `✓ موجودی ${current?.title} به ${finalStock} عدد بروزرسانی شد.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
