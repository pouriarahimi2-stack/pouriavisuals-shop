import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// حافظه موقت پایدار در صورت در دسترس نبودن موقت دیتابیس
let memorySiteInfo = {
  storeName: "Tech Store",
  siteTitle: "فروشگاه تخصصی محصولات دیجیتال",
  phone: "09120000000",
  email: "info@pouriavisuals.ir",
  address: "تهران، ایران",
  description: "فروشگاه تخصصی محصولات حوزه تکنولوژی",
  logoUrl: "",
  instagram: "",
  telegram: "",
  whatsapp: "",
  allowGoogleIndex: true,
};

export async function GET() {
  try {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("site_info")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({
          storeName: data.site_name || data.storeName || data.name || memorySiteInfo.storeName,
          siteTitle: data.site_title || data.siteTitle || data.title || memorySiteInfo.siteTitle,
          description: data.description || data.aboutText || memorySiteInfo.description,
          phone: data.phone || data.supportPhone || memorySiteInfo.phone,
          email: data.email || data.supportEmail || memorySiteInfo.email,
          address: data.address || memorySiteInfo.address,
          logoUrl: data.logo_url || data.logoUrl || memorySiteInfo.logoUrl,
          instagram: data.instagram || memorySiteInfo.instagram,
          telegram: data.telegram || memorySiteInfo.telegram,
          whatsapp: data.whatsapp || memorySiteInfo.whatsapp,
          allowGoogleIndex: data.allow_google_index !== undefined ? data.allow_google_index : true,
        });
      }
    }
  } catch (e) {
    console.error("API GET site-info error:", e);
  }

  return NextResponse.json(memorySiteInfo);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // به‌روزرسانی حافظه سرور
    memorySiteInfo = { ...memorySiteInfo, ...body };

    if (supabaseServer) {
      const { data: rows } = await supabaseServer.from("site_info").select("id").limit(1);

      const dbPayload: Record<string, any> = {
        site_name: body.storeName || body.site_name,
        site_title: body.siteTitle || body.site_title,
        description: body.aboutText || body.description,
        phone: body.phone,
        email: body.email,
        address: body.address,
        instagram: body.instagram,
        telegram: body.telegram,
        whatsapp: body.whatsapp,
      };

      if (body.logoUrl && !body.logoUrl.startsWith("data:image/")) {
        dbPayload.logo_url = body.logoUrl;
      }

      if (rows && rows.length > 0) {
        await supabaseServer.from("site_info").update(dbPayload).eq("id", rows[0].id);
      } else {
        await supabaseServer.from("site_info").insert([dbPayload]);
      }
    }

    return NextResponse.json({ success: true, data: memorySiteInfo });
  } catch (err: any) {
    console.error("API POST site-info error:", err);
    return NextResponse.json({ success: true, data: memorySiteInfo });
  }
}