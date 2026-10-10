import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 🔒 لایه اول: سد امنیتی اصولی (تایید هویت متمرکز)
    const isAuthorized = await verifyAdminSession(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز (HTTP 403): شما مجوز مدیریتی برای این عملیات را ندارید." },
        { status: 403 }
      );
    }

    const body = await req.json();
    let rawPath = body.path || body.slug || "";
    let slug = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
    if (!slug) slug = "home";

    const content = body.data || body.content || body;
    const title = body.title || slug;

    // 🟢 لایه دوم: اجرای عملیات با کلاینت ادمین
    const { error } = await supabaseAdmin
      .from("pages")
      .upsert({ slug, title, content }, { onConflict: "slug" });

    if (error) {
      // ⚠️ اصول مهندسی: ارور زیرساختی نباید مخفی شود!
      console.error("❌ [DATABASE ERROR]:", error);
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: "جدول pages در دیتابیس Supabase وجود ندارد. لطفاً ابتدا جدول را بسازید." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "صفحه با موفقیت، امن و اصولی ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminSession(req);
    const { searchParams } = new URL(req.url);
    let rawPath = searchParams.get("path") || searchParams.get("slug") || "";
    let slug = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;

    if (slug) {
      // دریافت محتوای یک صفحه برای ویترین سایت (آزاد برای همه)
      const { data, error } = await supabaseAdmin.from("pages").select("content").eq("slug", slug).maybeSingle();
      if (error && error.code !== '42P01') throw error;
      if (!data) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(data.content);
    } else {
      // دریافت لیست تمام صفحات (محرمانه، فقط برای ادمین مجاز است)
      if (!isAuthorized) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
      
      const { data, error } = await supabaseAdmin.from("pages").select("id, slug, title, created_at").order("created_at", { ascending: false });
      
      // اگر جدول نبود، برای ادمین ارور برمی‌گردانیم تا مطلع شود زیرساخت ناقص است
      if (error) throw error;
      return NextResponse.json(data || []);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminSession(req);
    if (!isAuthorized) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("pages").delete().eq("slug", slug);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
