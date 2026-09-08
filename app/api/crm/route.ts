import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

// واکشی کل اطلاعات CRM همراه با ادغام سفارشات ثبت‌شده
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    // ۱. دریافت مشتریان ذخیره‌شده در جدول crm_customers
    let crmCustomers: any[] = [];
    const { data: dbCrm, error: crmErr } = await supabaseAdmin
      .from("crm_customers")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!crmErr && dbCrm) {
      crmCustomers = dbCrm;
    }

    // ۲. بررسی سفارش‌ها جهت کشف خریداران جدید و همگام‌سازی خودکار (Auto-Sync)
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("customer_name, phone, address, postal_code, final_amount, total_amount, created_at, status")
      .neq("status", "cancelled");

    const ordersByPhone = new Map<string, { totalSpent: number; count: number; name: string; address: string; postal: string }>();

    (orders || []).forEach((o: any) => {
      const phone = String(o.phone || "").trim();
      if (!phone) return;
      const amount = Number(o.final_amount || o.total_amount || 0);

      if (ordersByPhone.has(phone)) {
        const item = ordersByPhone.get(phone)!;
        item.totalSpent += amount;
        item.count += 1;
        if (o.customer_name) item.name = o.customer_name;
        if (o.address) item.address = o.address;
      } else {
        ordersByPhone.set(phone, {
          totalSpent: amount,
          count: 1,
          name: o.customer_name || "خریدار محترم",
          address: o.address || "",
          postal: o.postal_code || "",
        });
      }
    });

    // ۳. ادغام و همگام‌سازی دوطرفه
    const finalMap = new Map<string, any>();

    // اول مشتریان ثبت‌شده در CRM
    crmCustomers.forEach((c) => {
      const orderStat = ordersByPhone.get(c.phone);
      const spent = orderStat ? Math.max(c.total_spent || 0, orderStat.totalSpent) : (c.total_spent || 0);
      const count = orderStat ? Math.max(c.order_count || 0, orderStat.count) : (c.order_count || 0);
      
      let stage = c.lifecycle_stage || "lead";
      if (spent > 100000000) stage = "vip";
      else if (count >= 3) stage = "active";
      else if (count >= 1) stage = "prospect";

      finalMap.set(c.phone, {
        ...c,
        total_spent: spent,
        order_count: count,
        lifecycle_stage: stage,
      });
    });

    // اضافه کردن خریدارانی که هنوز در crm_customers ذخیره نشده‌اند
    ordersByPhone.forEach((val, phone) => {
      if (!finalMap.has(phone)) {
        let stage = "prospect";
        if (val.totalSpent > 100000000) stage = "vip";
        else if (val.count >= 2) stage = "active";

        const newProfile = {
          id: "crm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          full_name: val.name,
          phone: phone,
          address: val.address,
          postal_code: val.postal,
          total_spent: val.totalSpent,
          order_count: val.count,
          lifecycle_stage: stage,
          tags: [stage === "vip" ? "الماس VIP" : "خریدار آنلاین"],
          internal_notes: "ثبت خودکار از طریق فاکتور فروشگاهی",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        finalMap.set(phone, newProfile);

        // ذخیره نامحسوس در جدول دیتابیس CRM
        supabaseAdmin.from("crm_customers").insert([newProfile]).then();
      }
    });

    return NextResponse.json({
      success: true,
      customers: Array.from(finalMap.values()),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ایجاد دستی مشتری جدید یا ویرایش پرونده
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, full_name, phone, email, province, city, address, postal_code, lifecycle_stage, tags, internal_notes } = body;

    const cleanPhone = String(phone || "").trim().replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString()).replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "شماره تلفن همراه ۱۱ رقمی معتبر الزامی است." }, { status: 400 });
    }

    const cleanName = String(full_name || "مشتری جدید").trim();
    const customerId = id || ("crm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

    const payload: Record<string, any> = {
      id: customerId,
      full_name: cleanName,
      phone: cleanPhone,
      email: email ? String(email).trim() : null,
      province: province || "تهران",
      city: city || "تهران",
      address: address ? String(address).trim() : null,
      postal_code: postal_code ? String(postal_code).trim() : null,
      lifecycle_stage: lifecycle_stage || "lead",
      tags: Array.isArray(tags) ? tags : ["مخاطب حضوری"],
      internal_notes: internal_notes ? String(internal_notes).trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("crm_customers").select("id").eq("phone", cleanPhone).maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin.from("crm_customers").update(payload).eq("id", existing.id).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "پرونده مشتری با موفقیت به‌روزرسانی شد.", data });
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin.from("crm_customers").insert([payload]).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, message: "مشتری جدید در پایگاه داده CRM ثبت گردید.", data });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف مشتری از CRM
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    if (!id && !phone) {
      return NextResponse.json({ success: false, message: "شناسه یا شماره تماس مشتری الزامی است." }, { status: 400 });
    }

    let query = supabaseAdmin.from("crm_customers").delete();
    if (id) query = query.eq("id", id);
    else if (phone) query = query.eq("phone", phone);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: "پرونده مشتری با موفقیت از سیستم CRM حذف گردید." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
