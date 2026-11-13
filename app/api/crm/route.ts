// File Path: app/api/crm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

const VIP_THRESHOLD_TOMAN = 50_000_000;

function normalizeIranPhone(raw: any): string {
  return String(raw || "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
}

function isOrderCancelled(o: { status?: string; payment_status?: string }) {
  const st = String(o.status || "").toLowerCase();
  const pst = String(o.payment_status || "").toLowerCase();
  return st === "cancelled" || pst === "failed" || pst === "cancelled";
}

function isOrderConfirmedPaid(o: { status?: string; payment_status?: string }) {
  if (isOrderCancelled(o)) return false;
  const st = String(o.status || "").toLowerCase();
  const pst = String(o.payment_status || "").toLowerCase();
  return ["paid", "processing", "shipped", "delivered"].includes(st) || pst === "paid";
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const [crmRes, ordersRes, siteRow] = await Promise.all([
      supabaseAdmin.from("crm_customers").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("orders")
        .select(
          "id, order_number, customer_name, phone, customer_phone, province, city, address, customer_address, postal_code, final_amount, total_amount, created_at, status, payment_status"
        )
        .order("created_at", { ascending: false }),
      getMasterSiteInfoRow(),
    ]);

    const rawCrm = crmRes.data || [];
    const orders = ordersRes.data || [];
    const archivedPhones = new Set<string>(
      Array.isArray(siteRow?.homepage_layout_config?.crm_archived_phones)
        ? siteRow.homepage_layout_config.crm_archived_phones
        : []
    );

    const orderStatsByPhone = new Map<
      string,
      {
        paidCount: number;
        paidSpent: number;
        pendingCount: number;
        pendingAmount: number;
        totalAttemptedOrders: number;
        lastDate: string;
        name: string;
        province: string;
        city: string;
        address: string;
        postalCode: string;
      }
    >();

    orders.forEach((o: any) => {
      if (isOrderCancelled(o)) return;
      const phone = normalizeIranPhone(o.phone || o.customer_phone);
      if (!phone) return;

      const amount = Number(o.final_amount || o.total_amount || 0);
      const isPaid = isOrderConfirmedPaid(o);
      const existing = orderStatsByPhone.get(phone);

      const ordProvince = String(o.province || "").trim();
      const ordCity = String(o.city || "").trim();
      const ordAddress = String(o.customer_address || o.address || "").trim();
      const ordPostal = String(o.postal_code || "").trim();

      if (!existing) {
        orderStatsByPhone.set(phone, {
          paidCount: isPaid ? 1 : 0,
          paidSpent: isPaid ? amount : 0,
          pendingCount: isPaid ? 0 : 1,
          pendingAmount: isPaid ? 0 : amount,
          totalAttemptedOrders: 1,
          lastDate: o.created_at || new Date().toISOString(),
          name: String(o.customer_name || "مشتری گرامی").trim(),
          province: ordProvince || "تهران",
          city: ordCity || "تهران",
          address: ordAddress,
          postalCode: ordPostal,
        });
      } else {
        existing.totalAttemptedOrders += 1;
        if (isPaid) {
          existing.paidCount += 1;
          existing.paidSpent += amount;
        } else {
          existing.pendingCount += 1;
          existing.pendingAmount += amount;
        }
        if (o.created_at && o.created_at > existing.lastDate) {
          existing.lastDate = o.created_at;
        }
        if (
          (!existing.province || existing.province === "تهران") &&
          ordProvince &&
          ordProvince !== "تهران"
        ) {
          existing.province = ordProvince;
        }
        if ((!existing.city || existing.city === "تهران") && ordCity && ordCity !== "تهران") {
          existing.city = ordCity;
        }
        if (!existing.address && ordAddress) existing.address = ordAddress;
        if (!existing.postalCode && ordPostal) existing.postalCode = ordPostal;
      }
    });

    const mergedMap = new Map<string, any>();

    rawCrm.forEach((c: any) => {
      const phone = normalizeIranPhone(c.phone);
      const ordStat = phone ? orderStatsByPhone.get(phone) : undefined;

      // اگر سفارش واقعی در جدول orders ثبت شده، آمار واقعی فاکتورهای پرداخت‌شده ملاک است
      const paidOrdersCount = ordStat
        ? ordStat.paidCount
        : Math.max(0, Number(c.order_count || c.total_orders || 0));
      const confirmedSpent = ordStat
        ? ordStat.paidSpent
        : Math.max(0, Number(c.total_spent || 0));
      const pendingOrdersCount = ordStat ? ordStat.pendingCount : 0;
      const pendingSpent = ordStat ? ordStat.pendingAmount : 0;

      let stage: string = c.lifecycle_stage || "lead";
      if (confirmedSpent >= VIP_THRESHOLD_TOMAN) {
        stage = "vip";
      } else if (paidOrdersCount > 0 && (stage === "lead" || stage === "prospect")) {
        stage = "active";
      } else if (!c.lifecycle_stage) {
        stage = paidOrdersCount > 0 ? "active" : pendingOrdersCount > 0 ? "prospect" : "lead";
      }

      const resolvedProvince =
        c.province && c.province !== "تهران"
          ? c.province
          : ordStat?.province || c.province || "تهران";
      const resolvedCity =
        c.city && c.city !== "تهران" ? c.city : ordStat?.city || c.city || "تهران";

      const baseTags: string[] =
        Array.isArray(c.tags) && c.tags.length > 0 ? [...c.tags] : ["مشتری فروشگاه"];
      if (stage === "vip" && !baseTags.includes("VIP")) {
        baseTags.unshift("VIP");
      }

      mergedMap.set(phone || String(c.id), {
        ...c,
        id: String(c.id),
        full_name: c.full_name || (ordStat ? ordStat.name : "مشتری گرامی"),
        phone: phone || "---",
        order_count: paidOrdersCount,
        total_orders: paidOrdersCount,
        total_spent: confirmedSpent,
        pending_orders_count: pendingOrdersCount,
        pending_amount: pendingSpent,
        last_order_date: ordStat?.lastDate || c.updated_at || c.created_at,
        lifecycle_stage: stage,
        tags: baseTags,
        province: resolvedProvince,
        city: resolvedCity,
        address: c.address || ordStat?.address || "",
        postal_code: c.postal_code || ordStat?.postalCode || "",
      });
    });

    orderStatsByPhone.forEach((stat, phone) => {
      if (!mergedMap.has(phone) && !archivedPhones.has(phone)) {
        const isVip = stat.paidSpent >= VIP_THRESHOLD_TOMAN;
        const stage = isVip
          ? "vip"
          : stat.paidCount > 0
          ? "active"
          : stat.pendingCount > 0
          ? "prospect"
          : "lead";

        mergedMap.set(phone, {
          id: "crm_" + phone,
          full_name: stat.name,
          phone,
          order_count: stat.paidCount,
          total_orders: stat.paidCount,
          total_spent: stat.paidSpent,
          pending_orders_count: stat.pendingCount,
          pending_amount: stat.pendingAmount,
          last_order_date: stat.lastDate,
          lifecycle_stage: stage,
          tags: isVip
            ? ["VIP", "خریدار ویژه"]
            : stat.paidCount > 0
            ? ["خریدار فعال"]
            : ["در انتظار تکمیل پرداخت"],
          province: stat.province || "تهران",
          city: stat.city || "تهران",
          address: stat.address || "",
          postal_code: stat.postalCode || "",
          created_at: stat.lastDate,
        });
      }
    });

    const customers = Array.from(mergedMap.values()).sort((a, b) => {
      if (b.total_spent !== a.total_spent) return b.total_spent - a.total_spent;
      return (b.order_count || 0) - (a.order_count || 0);
    });

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
    const cleanPhone = normalizeIranPhone(body.phone);

    if (!fullName || !cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("09")) {
      return NextResponse.json(
        { success: false, message: "نام کامل و شماره موبایل معتبر ۱۱ رقمی (09...) الزامی است." },
        { status: 400 }
      );
    }

    const cleanTags = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : ["ثبت دستی"];

    const payload: Record<string, any> = {
      full_name: fullName,
      phone: cleanPhone,
      email: body.email ? String(body.email).trim() : null,
      province: body.province ? String(body.province).trim() : "تهران",
      city: body.city ? String(body.city).trim() : "تهران",
      address: body.address ? String(body.address).trim() : null,
      postal_code: body.postal_code ? normalizeIranPhone(body.postal_code) : null,
      lifecycle_stage: body.lifecycle_stage || "lead",
      tags: cleanTags.length > 0 ? cleanTags : ["مشتری فروشگاه"],
      internal_notes: body.internal_notes ? String(body.internal_notes).trim() : null,
      updated_at: new Date().toISOString(),
    };

    if (body.total_spent !== undefined) payload.total_spent = Math.max(0, Number(body.total_spent));
    if (body.order_count !== undefined) payload.order_count = Math.max(0, Number(body.order_count));

    // خارج کردن شماره از لیست آرشیو در صورت ثبت مجدد
    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const currentArchived: string[] = Array.isArray(layoutCfg.crm_archived_phones)
        ? layoutCfg.crm_archived_phones
        : [];
      if (currentArchived.includes(cleanPhone)) {
        const nextArchived = currentArchived.filter((p) => p !== cleanPhone);
        await saveMasterSiteInfoRow(
          siteRow,
          { ...layoutCfg, crm_archived_phones: nextArchived },
          {}
        );
      }
    } catch {}

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
        message: "✓ پرونده مشتری در سامانه CRM با موفقیت به‌روزرسانی شد.",
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
            total_spent: Math.max(0, Number(body.total_spent || 0)),
            order_count: Math.max(0, Number(body.order_count || 0)),
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "✓ پرونده مشتری جدید با موفقیت در سامانه CRM ثبت شد.",
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
    const cleanPhone = normalizeIranPhone(phone);

    if (!id && !cleanPhone) {
      return NextResponse.json(
        { success: false, message: "شناسه یا شماره تلفن مشتری الزامی است." },
        { status: 400 }
      );
    }

    if (id && !id.startsWith("crm_")) {
      await supabaseAdmin.from("crm_customers").delete().eq("id", id);
    }
    if (cleanPhone) {
      await supabaseAdmin.from("crm_customers").delete().eq("phone", cleanPhone);
      try {
        const siteRow = await getMasterSiteInfoRow();
        const layoutCfg = siteRow?.homepage_layout_config || {};
        const currentArchived: string[] = Array.isArray(layoutCfg.crm_archived_phones)
          ? layoutCfg.crm_archived_phones
          : [];
        if (!currentArchived.includes(cleanPhone)) {
          await saveMasterSiteInfoRow(
            siteRow,
            { ...layoutCfg, crm_archived_phones: [...currentArchived, cleanPhone] },
            {}
          );
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "✓ پرونده مشتری با موفقیت از CRM حذف شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}