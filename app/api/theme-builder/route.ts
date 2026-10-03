// File Path: app/api/theme-builder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { DEFAULT_HOMEPAGE_LAYOUT_CONFIG } from "@/services/siteInfoService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: rows } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);

    const data = rows && rows.length > 0 ? rows[0] : null;
    const layoutCfg =
      data?.homepage_layout_config && typeof data.homepage_layout_config === "object"
        ? data.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const existingTb = layoutCfg.theme_builder_config || {};
    const existingGh = existingTb.globalHeader || {};
    const existingGf = existingTb.globalFooter || {};

    const storedTheme = {
      ...existingTb,
      globalHeader: {
        brandName: existingGh.brandName || data?.site_name || "آکسون کور | Axon Core",
        logoText: existingGh.logoText || data?.site_name || "آکسون کور",
        logoUrl: existingGh.logoUrl !== undefined ? existingGh.logoUrl : data?.logo_url || "",
        logoWidth: Number(existingGh.logoWidth || 38),
        logoHeight: Number(existingGh.logoHeight || 38),
        logoRadius: existingGh.logoRadius || "12px",
        logoObjectFit: existingGh.logoObjectFit || "contain",
        faviconUrl: existingGh.faviconUrl || data?.favicon_url || "/favicon.ico",
        variant: existingGh.variant || "capsule",
        height: Number(existingGh.height || 60),
        announcementText:
          existingGh.announcementText !== undefined
            ? existingGh.announcementText
            : data?.header_announcement || "",
        announcementEnabled: Boolean(
          existingGh.announcementEnabled ?? layoutCfg?.header?.announcement?.show ?? false
        ),
        ctaText: existingGh.ctaText || "کاتالوگ محصولات",
        ctaUrl: existingGh.ctaUrl || "/products",
        bgColor: existingGh.bgColor || "",
      },
      globalFooter: {
        ...existingGf,
        footerLogoUrl:
          existingGf.footerLogoUrl !== undefined
            ? existingGf.footerLogoUrl
            : data?.footer_logo_url || "",
        brandTitle: existingGf.brandTitle || data?.site_name || "آکسون کور | Axon Core",
        brandSubtitle:
          existingGf.brandSubtitle ||
          data?.tagline ||
          "مرجع تخصصی تجهیزات تکنولوژی، سخت‌افزار و کالای دیجیتال",
        brandDescription:
          existingGf.brandDescription !== undefined
            ? existingGf.brandDescription
            : data?.description || "",
        scaleMode: existingGf.scaleMode || "normal",
        paddingMode: existingGf.paddingMode || "normal",
        bgColor: existingGf.bgColor || "",
        columnOrder:
          Array.isArray(existingGf.columnOrder) && existingGf.columnOrder.length === 4
            ? existingGf.columnOrder
            : ["brand", "quick_links", "support", "enamad"],
        supportPhone: existingGf.supportPhone || data?.phone || "09376110200",
        supportEmail: existingGf.supportEmail || data?.email || "Pouriarahimi@yahoo.com",
        warehouseAddress: existingGf.warehouseAddress || data?.address || "شیراز - ستارخان",
        workingHours:
          existingGf.workingHours || data?.working_hours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: existingGf.enamadCode || "7434404",
        enamadLink:
          existingGf.enamadLink ||
          "https://trustseal.enamad.ir/?id=7434404&Code=RqxtofLwJnKsvqQACWz1mvYVVKykOrtD",
        enamadEnabled: existingGf.enamadEnabled !== false,
        copyright:
          existingGf.copyright ||
          data?.footer_text ||
          "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        quickLinks: existingGf.quickLinks || [
          { id: "q1", title: "🛍️️ کاتالوگ محصولات دیجیتال", url: "/products", show: true },
          { id: "q2", title: "📡 رادار اخبار تکنولوژی", url: "/news", show: true },
          { id: "q3", title: "📚 مجله تخصصی و راهنمای خرید", url: "/blog", show: true },
          { id: "q4", title: "📦 پیگیری لحظه‌ای سفارشات", url: "/track-order", show: true },
        ],
        externalLinks: existingGf.externalLinks || [
          { id: "ext_torob", title: "فید رسمی محصولات در ترب (Torob)", url: "/api/torob", show: true },
          { id: "ext_sitemap", title: "نقشه سایت گوگل (Sitemap)", url: "/sitemap.xml", show: true },
        ],
      },
      bannerSizing: existingTb.bannerSizing ||
        layoutCfg.bannerSizing || {
          mobileHeight: 160,
          tabletHeight: 250,
          desktopHeight: 340,
          mobileImageSize: 90,
          desktopImageSize: 220,
          mobileLayout: "horizontal",
        },
      homeSections: Array.isArray(existingTb.homeSections)
        ? existingTb.homeSections
        : layoutCfg.homeSections || [],
    };

    return NextResponse.json(
      { success: true, config: storedTheme },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { config } = body;

    const { data: allRows } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("updated_at", { ascending: false });

    const existing = allRows && allRows.length > 0 ? allRows[0] : null;

    // حذف ردیف‌های تکراری احتمالی در جدول site_info تا همیشه فقط ۱ ردیف واحد وجود داشته باشد
    if (allRows && allRows.length > 1) {
      const duplicateIds = allRows.slice(1).map((r: any) => r.id).filter(Boolean);
      if (duplicateIds.length > 0) {
        await supabaseAdmin.from("site_info").delete().in("id", duplicateIds);
      }
    }

    const prevLayout =
      existing?.homepage_layout_config && typeof existing.homepage_layout_config === "object"
        ? existing.homepage_layout_config
        : DEFAULT_HOMEPAGE_LAYOUT_CONFIG;

    const prevTb = prevLayout.theme_builder_config || {};
    const gh = { ...(prevTb.globalHeader || {}), ...(config?.globalHeader || {}) };
    const gf = { ...(prevTb.globalFooter || {}), ...(config?.globalFooter || {}) };

    const homeSections = Array.isArray(config?.homeSections)
      ? config.homeSections
      : prevTb.homeSections || prevLayout.homeSections || [];

    const bannerSizing = config?.bannerSizing ||
      prevTb.bannerSizing ||
      prevLayout.bannerSizing || {
        mobileHeight: 160,
        tabletHeight: 250,
        desktopHeight: 340,
        mobileImageSize: 90,
        desktopImageSize: 220,
        mobileLayout: "horizontal",
      };

    const headerLogoUrl = gh.logoUrl !== undefined ? String(gh.logoUrl).trim() : "";
    const footerLogoUrl = gf.footerLogoUrl !== undefined ? String(gf.footerLogoUrl).trim() : "";
    const faviconUrl = gh.faviconUrl !== undefined ? String(gh.faviconUrl).trim() : "/favicon.ico";

    const updatedLayout = {
      ...prevLayout,
      theme_builder_config: {
        ...prevTb,
        ...config,
        globalHeader: { ...gh, logoUrl: headerLogoUrl, faviconUrl },
        globalFooter: { ...gf, footerLogoUrl },
        bannerSizing,
        homeSections,
      },
      bannerSizing,
      homeSections,
      header: {
        ...(prevLayout.header || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.header),
        variant: gh.variant || "capsule",
        height: Number(gh.height || 60),
        brand: {
          name: gh.brandName || "آکسون کور | Axon Core",
          logoUrl: headerLogoUrl,
          logoWidth: Number(gh.logoWidth || 38),
          logoHeight: Number(gh.logoHeight || 38),
          showLogo: true,
          showName: true,
        },
        announcement: {
          show: Boolean(gh.announcementEnabled),
          text: String(gh.announcementText || ""),
          backgroundColor: "#0284c7",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      footer: {
        ...(prevLayout.footer || DEFAULT_HOMEPAGE_LAYOUT_CONFIG.footer),
        logoUrl: footerLogoUrl,
        footerLogoUrl,
        brandTitle: gf.brandTitle || gh.brandName || "آکسون کور | Axon Core",
        brandSubtitle: gf.brandSubtitle || "",
        description: String(gf.brandDescription ?? ""),
        scaleMode: gf.scaleMode || "normal",
        paddingMode: gf.paddingMode || "normal",
        bgColor: gf.bgColor || "",
        columnOrder: gf.columnOrder || ["brand", "quick_links", "support", "enamad"],
        supportPhone: gf.supportPhone || "09376110200",
        supportEmail: gf.supportEmail || "Pouriarahimi@yahoo.com",
        warehouseAddress: gf.warehouseAddress || "شیراز - ستارخان",
        workingHours: gf.workingHours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
        enamadCode: gf.enamadCode || "7434404",
        enamadLink: gf.enamadLink || "",
        enamadEnabled: gf.enamadEnabled !== false,
        quickLinks: { show: true, title: "دسترسی سریع", links: gf.quickLinks || [] },
        externalLinks: gf.externalLinks || [],
        bottomBar: {
          show: true,
          copyrightText: gf.copyright || "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
        },
      },
    };

    const fullUpdateObj: Record<string, any> = {
      site_name: gh.brandName || gf.brandTitle || "آکسون کور | Axon Core",
      tagline: gf.brandSubtitle || "فروشگاه تخصصی محصولات تکنولوژی و گجت‌های هوشمند",
      description: String(gf.brandDescription ?? ""),
      footer_text: gf.copyright || "تمامی حقوق مادی و معنوی برای آکسون کور محفوظ است © 2026",
      logo_url: headerLogoUrl,
      footer_logo_url: footerLogoUrl,
      favicon_url: faviconUrl,
      phone: gf.supportPhone || "09376110200",
      email: gf.supportEmail || "Pouriarahimi@yahoo.com",
      address: gf.warehouseAddress || "شیراز - ستارخان",
      working_hours: gf.workingHours || "شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰",
      homepage_layout_config: updatedLayout,
      header_announcement: String(gh.announcementText || ""),
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error: uErr } = await supabaseAdmin
        .from("site_info")
        .update(fullUpdateObj)
        .eq("id", existing.id);

      if (uErr) {
        await supabaseAdmin
          .from("site_info")
          .update({
            site_name: fullUpdateObj.site_name,
            logo_url: headerLogoUrl,
            favicon_url: faviconUrl,
            homepage_layout_config: updatedLayout,
            header_announcement: fullUpdateObj.header_announcement,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }
    } else {
      await supabaseAdmin.from("site_info").insert([fullUpdateObj]);
    }

    return NextResponse.json({
      success: true,
      config: updatedLayout.theme_builder_config,
      siteInfo: {
        ...fullUpdateObj,
        homepage_layout_config: updatedLayout,
        theme_builder_config: updatedLayout.theme_builder_config,
      },
      message: "✓ تغییرات با موفقیت در دیتابیس ذخیره و به صورت زنده در کل سایت اعمال شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
