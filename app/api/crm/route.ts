// File Path: app/api/crm/route.ts
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

    const [crmRes, ordersRes] = await Promise.all([
      supabaseAdmin.from("crm_customers").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("id, customer_name, phone, final_amount, total_amount, created_at, status"),
    ]);

    const rawCrm = crmRes.data || [];
    const orders = ordersRes.data || [];

    const orderStatsByPhone = new Map<string, { count: number; spent: number; lastDate: string; name: string }>();
    orders.forEach((o: any) => {
      if (o.status === "cancelled") return;
      const phone = String(o.phone || "").trim();
      if (!phone) return;
      const amount = Number(o.final_amount || o.total_amount || 0);
      const existing = orderStatsByPhone.get(phone);
      if (!existing) {
        orderStatsByPhone.set(phone, {
          count: 1,
          spent: amount,
          lastDate: o.created_at || new Date().toISOString(),
          name: o.customer_name || "مشتری گرامی",
        });
      } else {
        existing.count += 1;
        existing.spent += amount;
      }
    });

    const mergedMap = new Map<string, any>();

    rawCrm.forEach((c: any) => {
      const phone = String(c.phone || "").trim();
      const ordStat = orderStatsByPhone.get(phone);
      const totalOrders = Math.max(Number(c.order_count || c.total_orders || 0), ordStat ? ordStat.count : 0);
      const totalSpent = Math.max(Number(c.total_spent || 0), ordStat ? ordStat.spent : 0);
      const stage = c.lifecycle_stage || (totalSpent > 80000000 ? "vip" : totalOrders > 0 ? "active" : "lead");

      mergedMap.set(phone || String(c.id), {
        ...c,
        id: String(c.id),
        full_name: c.full_name || (ordStat ? ordStat.name : "مشتری گرامی"),
        phone: phone || "---",
        order_count: totalOrders,
        total_orders: totalOrders,
        total_spent: totalSpent,
        lifecycle_stage: stage,
        tags: Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : ["مشتری فروشگاه"],
        province: c.province || "تهران",
        city: c.city || "تهران",
      });
    });

    orderStatsByPhone.forEach((stat, phone) => {
      if (!mergedMap.has(phone)) {
        mergedMap.set(phone, {
          id: "crm_" + phone,
          full_name: stat.name,
          phone,
          order_count: stat.count,
          total_orders: stat.count,
          total_spent: stat.spent,
          last_order_date: stat.lastDate,
          lifecycle_stage: stat.spent > 80000000 ? "vip" : "active",
          tags: stat.spent > 80000000 ? ["VIP", "خریدار ویژه"] : ["خریدار فعال"],
          province: "تهران",
          city: "تهران",
          created_at: stat.lastDate,
        });
      }
    });

    const customers = Array.from(mergedMap.values());
    return NextResponse.json({ success: true, customers });
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
    const fullName = String(body.full_name || "").trim();
    const cleanPhone = String(body.phone || "").replace(/\D/g, "");

    if (!fullName || !cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json(
        { success: false, message: "نام کامل و شماره موبایل ۱۱ رقمی الزامی است." },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      full_name: fullName,
      phone: cleanPhone,
      email: body.email ? String(body.email).trim() : null,
      province: body.province ? String(body.province).trim() : "تهران",
      city: body.city ? String(body.city).trim() : "تهران",
      address: body.address ? String(body.address).trim() : null,
      postal_code: body.postal_code ? String(body.postal_code).trim() : null,
      lifecycle_stage: body.lifecycle_stage || "lead",
      tags: Array.isArray(body.tags) ? body.tags : ["ثبت دستی"],
      internal_notes: body.internal_notes ? String(body.internal_notes).trim() : null,
      updated_at: new Date().toISOString(),
    };

    if (body.total_spent !== undefined) payload.total_spent = Number(body.total_spent);
    if (body.order_count !== undefined) payload.order_count = Number(body.order_count);

    const { data: existingByPhone } = await supabaseAdmin
      .from("crm_customers")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    const targetId =
      body.id && !String(body.id).startsWith("crm_")
        ? String(body.id)
        : existingByPhone
        ? String(existingByPhone.id)
        : null;

    if (targetId) {
      const { data: updated, error } = await supabaseAdmin
        .from("crm_customers")
        .update(payload)
        .eq("id", targetId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "پرونده مشتری در سامانه CRM با موفقیت به‌روزرسانی شد.",
        customer: updated,
      });
    } else {
      const newId = "cust_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      const { data: inserted, error } = await supabaseAdmin
        .from("crm_customers")
        .insert([
          {
            id: newId,
            ...payload,
            total_spent: Number(body.total_spent || 0),
            order_count: Number(body.order_count || 0),
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "پرونده مشتری جدید با موفقیت در سامانه CRM ثبت شد.",
        customer: inserted,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    if (!id && !phone) {
      return NextResponse.json({ success: false, message: "شناسه یا شماره تلفن مشتری الزامی است." }, { status: 400 });
    }

    if (id && !id.startsWith("crm_")) {
      await supabaseAdmin.from("crm_customers").delete().eq("id", id);
    }
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone) {
        await supabaseAdmin.from("crm_customers").delete().eq("phone", cleanPhone);
      }
    }

    return NextResponse.json({ success: true, message: "پرونده مشتری با موفقیت از CRM حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
