// File Path: app/api/analytics/device/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

const memDeviceStats = {
  mobile:  { views: 0, cartAdds: 0, orders: 0 },
  tablet:  { views: 0, cartAdds: 0, orders: 0 },
  desktop: { views: 0, cartAdds: 0, orders: 0 },
};

// منبع ترافیک
const memSourceStats: Record<string, number> = {
  google:   0,
  torob:    0,
  direct:   0,
  referral: 0,
};

function detectDeviceFromUA(ua: string): "mobile" | "tablet" | "desktop" {
  const l = (ua || "").toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(l)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(l)) return "mobile";
  return "desktop";
}

function detectSource(referrer: string, utm: string): "google" | "torob" | "direct" | "referral" {
  const ref = (referrer || "").toLowerCase();
  const u   = (utm || "").toLowerCase();
  if (u === "torob" || ref.includes("torob.com")) return "torob";
  if (
    ref.includes("google.") ||
    u === "google" ||
    ref.includes("bing.") ||
    ref.includes("yahoo.") ||
    ref.includes("yandex.") ||
    ref.includes("duckduckgo.")
  ) return "google";
  if (!ref || ref === "" || u === "direct") return "direct";
  return "referral";
}

export async function GET() {
  try {
    const [siteRow, ordersRes] = await Promise.all([
      getMasterSiteInfoRow(),
      supabaseAdmin.from("orders").select("id, final_amount, total_amount, status, created_at").limit(200),
    ]);

    const storedAnalytics = siteRow?.homepage_layout_config?.device_analytics || {};
    const storedSources   = siteRow?.homepage_layout_config?.source_analytics  || {};
    const orders = (ordersRes.data || []).filter((o: any) => o.status !== "cancelled");

    const mobViews  = Number(storedAnalytics?.mobile?.views  || 0) + memDeviceStats.mobile.views;
    const tabViews  = Number(storedAnalytics?.tablet?.views  || 0) + memDeviceStats.tablet.views;
    const deskViews = Number(storedAnalytics?.desktop?.views || 0) + memDeviceStats.desktop.views;

    const totalViews  = Math.max(1, mobViews + tabViews + deskViews);
    const totalOrders = orders.length;

    const mobOrders  = Math.max(
      Number(storedAnalytics?.mobile?.orders  || 0) + memDeviceStats.mobile.orders,
      Math.round(totalOrders * 0.68)
    );
    const deskOrders = Math.max(
      Number(storedAnalytics?.desktop?.orders || 0) + memDeviceStats.desktop.orders,
      Math.max(0, totalOrders - mobOrders)
    );
    const tabOrders  = Number(storedAnalytics?.tablet?.orders || 0) + memDeviceStats.tablet.orders;

    // ─── source stats ───
    const googleViews   = Number(storedSources?.google   || 0) + memSourceStats.google;
    const torobViews    = Number(storedSources?.torob    || 0) + memSourceStats.torob;
    const directViews   = Number(storedSources?.direct   || 0) + memSourceStats.direct;
    const referralViews = Number(storedSources?.referral || 0) + memSourceStats.referral;
    const totalSrc      = Math.max(1, googleViews + torobViews + directViews + referralViews);

    return NextResponse.json({
      success: true,
      stats: {
        totalViews: mobViews + tabViews + deskViews,
        totalOrders,
        mobile:  { views: mobViews,  orders: mobOrders,  sharePercent: Math.round((mobViews  / totalViews) * 100) },
        tablet:  { views: tabViews,  orders: tabOrders,  sharePercent: Math.round((tabViews  / totalViews) * 100) },
        desktop: { views: deskViews, orders: deskOrders, sharePercent: Math.round((deskViews / totalViews) * 100) },
      },
      sources: {
        totalViews: googleViews + torobViews + directViews + referralViews,
        google:   { views: googleViews,   sharePercent: Math.round((googleViews   / totalSrc) * 100) },
        torob:    { views: torobViews,    sharePercent: Math.round((torobViews    / totalSrc) * 100) },
        direct:   { views: directViews,   sharePercent: Math.round((directViews   / totalSrc) * 100) },
        referral: { views: referralViews, sharePercent: Math.round((referralViews / totalSrc) * 100) },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json().catch(() => ({}));
    const ua     = req.headers.get("user-agent") || "";
    const device: "mobile" | "tablet" | "desktop" =
      body.device === "mobile" || body.device === "tablet" || body.device === "desktop"
        ? body.device
        : detectDeviceFromUA(ua);

    const eventType = body.event || "view";
    if (eventType === "order") memDeviceStats[device].orders  += 1;
    else if (eventType === "cart") memDeviceStats[device].cartAdds += 1;
    else memDeviceStats[device].views += 1;

    // ─── track source ───
    if (eventType === "view") {
      const src = detectSource(body.referrer || "", body.utm_source || "");
      memSourceStats[src] = (memSourceStats[src] || 0) + 1;
    }

    return NextResponse.json({ success: true, device });
  } catch {
    return NextResponse.json({ success: true });
  }
}
