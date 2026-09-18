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

    // واکشی همزمان از جدول crm_customers و جدول orders
    const [crmRes, ordersRes] = await Promise.all([
      supabaseAdmin.from("crm_customers").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("id, customer_name, phone, final_amount, total_amount, created_at, status"),
    ]);

    let customers = crmRes.data || [];
    const orders = ordersRes.data || [];

    // اگر جدول اختصاصی هنوز رکوردی نداشت، مشتریان را از فاکتورها سنتز و استخراج کن
    if (customers.length === 0 && orders.length > 0) {
      const customerMap = new Map();

      orders.forEach((o: any) => {
        const phone = o.phone || "---";
        const amount = Number(o.final_amount || o.total_amount || 0);
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            id: "crm_" + phone,
            full_name: o.customer_name || "مشتری گرامی",
            phone,
            total_orders: 1,
            total_spent: amount,
            last_order_date: o.created_at,
            lifecycle_stage: amount > 80000000 ? "vip" : "active",
            created_at: o.created_at,
          });
        } else {
          const cur = customerMap.get(phone);
          cur.total_orders += 1;
          cur.total_spent += amount;
          if (cur.total_spent > 80000000) cur.lifecycle_stage = "vip";
        }
      });

      customers = Array.from(customerMap.values());
    }

    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
