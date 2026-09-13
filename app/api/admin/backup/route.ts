import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import * as SessionModule from "@/lib/session";

export const dynamic = "force-dynamic";

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  try {
    const sessionCookieName = (SessionModule as any).COOKIE_NAME || (SessionModule as any).COOKIE_NAME || "admin_session_token";
    const token = req.cookies.get(sessionCookieName)?.value || req.cookies.get("admin_session_token")?.value;
    if (!token) return false;

    const verifyFn = (SessionModule as any).verifyPayload || (SessionModule as any).verifyToken || (SessionModule as any).verifyPayload;
    if (typeof verifyFn === "function") {
      const session = await verifyFn(token);
      return Boolean(session);
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const isAuthed = await checkAdminAuth(req);
  if (!isAuthed) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const [products, coupons, siteInfo, banners] = await Promise.all([
      supabaseAdmin.from("products").select("*"),
      supabaseAdmin.from("coupons").select("*"),
      supabaseAdmin.from("site_info").select("*"),
      supabaseAdmin.from("banners").select("*"),
    ]);

    const backupData = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      data: {
        products: products.data || [],
        coupons: coupons.data || [],
        site_info: siteInfo.data || [],
        banners: banners.data || [],
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="axon-backup-${Date.now()}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthed = await checkAdminAuth(req);
  if (!isAuthed) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const json = await req.json();
    if (!json.data || typeof json.data !== "object") {
      return NextResponse.json({ success: false, message: "ساختار فایل پشتیبان نامعتبر است." }, { status: 400 });
    }

    const { products, coupons, banners } = json.data;

    if (Array.isArray(products) && products.length > 0) {
      await supabaseAdmin.from("products").upsert(products);
    }
    if (Array.isArray(coupons) && coupons.length > 0) {
      await supabaseAdmin.from("coupons").upsert(coupons);
    }
    if (Array.isArray(banners) && banners.length > 0) {
      await supabaseAdmin.from("banners").upsert(banners);
    }

    return NextResponse.json({
      success: true,
      message: "اطلاعات با موفقیت در پایگاه داده بازگردانی شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
