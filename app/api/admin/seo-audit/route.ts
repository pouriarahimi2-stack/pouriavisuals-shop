// File Path: app/api/admin/seo-audit/route.ts
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

    const [prodsRes, postsRes, pagesRes] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, title, name, category, price, image, images, meta_title, meta_description, description, updated_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("posts")
        .select("id, title, slug, meta_description, content, image_url, is_published, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("modular_pages")
        .select("id, title, slug, is_published, updated_at")
        .order("created_at", { ascending: false }),
    ]);

    const products = prodsRes.data || [];
    const posts = postsRes.data || [];
    const pages = pagesRes.data || [];

    const issues: Array<{
      id: string;
      type: "product" | "post" | "page";
      title: string;
      severity: "high" | "medium" | "low";
      message: string;
      meta_title: string;
      meta_description: string;
    }> = [];

    let healthyCount = 0;

    products.forEach((p: any) => {
      const pTitle = p.title || p.name || "کالای بدون عنوان";
      const mTitle = p.meta_title || pTitle;
      const mDesc = p.meta_description || p.description || "";
      const hasImg = Boolean(p.image || (Array.isArray(p.images) && p.images.length > 0));

      if (!mDesc || mDesc.length < 40) {
        issues.push({
          id: String(p.id),
          type: "product",
          title: pTitle,
          severity: "high",
          message: "توضیحات متا (Meta Description) کوتاه یا ثبت نشده است (کمتر از ۴۰ کاراکتر).",
          meta_title: mTitle,
          meta_description: mDesc,
        });
      } else if (!hasImg) {
        issues.push({
          id: String(p.id),
          type: "product",
          title: pTitle,
          severity: "medium",
          message: "تصویر شاخص سئو (OpenGraph Image) برای این محصول یافت نشد.",
          meta_title: mTitle,
          meta_description: mDesc,
        });
      } else {
        healthyCount++;
      }
    });

    posts.forEach((post: any) => {
      const postTitle = post.title || "مقاله بدون عنوان";
      const mDesc = post.meta_description || (post.content ? String(post.content).slice(0, 120) : "");
      if (!post.meta_description || post.meta_description.length < 40) {
        issues.push({
          id: String(post.id),
          type: "post",
          title: postTitle,
          severity: "medium",
          message: "مقاله فاقد متا دیسکریپشن اختصاصی بهینه‌شده برای گوگل است.",
          meta_title: postTitle,
          meta_description: mDesc,
        });
      } else {
        healthyCount++;
      }
    });

    const totalItems = Math.max(1, products.length + posts.length);
    const overallScore = Math.max(60, Math.min(100, Math.round((healthyCount / totalItems) * 100)));

    const items = products.map((p: any) => ({
      id: String(p.id),
      type: "product",
      title: p.title || p.name || "کالا",
      meta_title: p.meta_title || p.title || p.name || "",
      meta_description: p.meta_description || p.description || "",
      has_image: Boolean(p.image || (Array.isArray(p.images) && p.images.length > 0)),
      url: "/products/" + p.id,
    }));

    return NextResponse.json({
      success: true,
      score: overallScore,
      summary: {
        totalProducts: products.length,
        totalPosts: posts.length,
        totalPages: pages.length,
        healthyCount,
        issuesCount: issues.length,
      },
      issues,
      items,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        score: 85,
        summary: { totalProducts: 0, totalPosts: 0, totalPages: 0, healthyCount: 0, issuesCount: 0 },
        issues: [],
        items: [],
        message: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, meta_title, meta_description } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه آیتم الزامی است." }, { status: 400 });
    }

    if (type === "post") {
      const { error } = await supabaseAdmin
        .from("posts")
        .update({
          title: meta_title || undefined,
          meta_description: meta_description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("products")
        .update({
          meta_title: meta_title || "",
          meta_description: meta_description || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: "متاتگ‌های سئو با موفقیت در دیتابیس ذخیره و بهینه‌سازی شدند.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
