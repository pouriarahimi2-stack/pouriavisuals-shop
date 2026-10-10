import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // امنیت ۱۰۰٪: فقط ادمین تایید شده حق ساخت یا ویرایش صفحه دارد
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز. فقط مدیر سایت می‌تواند صفحه بسازد." }, { status: 403 });
    }

    const body = await req.json();
    let rawPath = body.path || body.slug || "";
    let slug = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
    if (!slug) slug = "home";

    const content = body.data || body.content || body;
    const title = body.title || slug;

    // ذخیره در دیتابیس با دسترسی ادمین
    const { error } = await supabaseAdmin
      .from("pages")
      .upsert({ slug, title, content }, { onConflict: "slug" });

    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "صفحه با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let rawPath = searchParams.get("path") || searchParams.get("slug") || "";
    let slug = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;

    if (slug) {
      const { data, error } = await supabaseAdmin.from("pages").select("content").eq("slug", slug).maybeSingle();
      if (error || !data) return NextResponse.json(null, { status: 404 });
      return NextResponse.json(data.content);
    } else {
      // این بخش لیست تمام صفحات را برای پنل ادمین می‌فرستد
      const { data, error } = await supabaseAdmin.from("pages").select("id, slug, title, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json(data || []);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

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
