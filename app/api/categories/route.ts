// File Path: app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

function makeCategorySlug(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const [{ data: categories, error }, { data: prodRows }] = await Promise.all([
      supabaseAdmin.from("categories").select("*").order("created_at", { ascending: true }),
      supabaseAdmin.from("products").select("category"),
    ]);

    if (error) {
      console.warn("Categories table warning:", error.message);
    }

    const combined: any[] = Array.isArray(categories) ? [...categories] : [];
    const seenNames = new Set<string>(
      combined.map((c: any) => String(c.name || c.title || "").trim())
    );

    // ادغام خودکار دسته‌بندی‌های ثبت‌شده روی کالاهای کاتالوگ
    (prodRows || []).forEach((row: any) => {
      const catName = String(row?.category || "").trim();
      if (catName && !seenNames.has(catName)) {
        seenNames.add(catName);
        const slug = makeCategorySlug(catName) || "category";
        combined.push({
          id: "cat_" + slug,
          name: catName,
          title: catName,
          slug,
          description: null,
          icon: "📁",
          is_active: true,
        });
      }
    });

    return NextResponse.json({
      success: true,
      categories: combined,
      data: combined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || body.title || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "نام دسته‌بندی الزامی است." },
        { status: 400 }
      );
    }

    const slug = makeCategorySlug(body.slug || name);

    const payload = {
      name,
      title: name,
      slug,
      description: body.description ? String(body.description).trim() : null,
      icon: body.icon || "📁",
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.id && !String(body.id).startsWith("cat_")) {
      const { data: updated, error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", body.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "دسته‌بندی با موفقیت به‌روزرسانی شد.",
        category: updated,
        data: updated,
      });
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("categories")
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: "دسته‌‌بندی جدید با موفقیت ایجاد شد.",
        category: inserted,
        data: inserted,
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
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه دسته‌بندی الزامی است." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "دسته‌بندی با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}