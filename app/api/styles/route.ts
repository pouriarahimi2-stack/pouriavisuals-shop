// File Path: app/api/styles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export const dynamic = "force-dynamic";

const DEFAULT_VISUAL_META = {
  font_weight: 400,
  glass_blur_px: 20,
  card_shadow_strength: "medium" as "soft" | "medium" | "deep" | "neon",
  button_hover_scale: 1.03,
  line_height_scale: 1.8,
  heading_tracking: "-0.02em",
  user_raw_css: "",
  custom_fonts: [] as any[],
};

function extractEmbeddedMetaFromCss(css: string): Partial<typeof DEFAULT_VISUAL_META> {
  if (!css) return {};
  const match = css.match(/\/\* === AXON_STYLE_META:(\{[\s\S]*?\}) === \*\//);
  if (!match || !match[1]) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function extractUserRawCss(css: string): string {
  if (!css) return "";
  return css
    .replace(/\/\* === AXON_STYLE_META:\{[\s\S]*?\} === \*\//g, "")
    .replace(
      /\/\* === AXON VISUAL CSS ENGINE START === \*\/[\s\S]*?\/\* === AXON VISUAL CSS ENGINE END === \*\//g,
      ""
    )
    .replace(/\/\* === AXON CUSTOM FONTS START === \*\/[\s\S]*?\/\* === AXON CUSTOM FONTS END === \*\//g, "")
    .replace(/\/\* === AXON VISUAL CSS ENGINE === \*\/[\s\S]*?(?=\/\*|$)/g, "")
    .trim();
}

export async function GET() {
  try {
    const [stylesRes, siteRow] = await Promise.all([
      supabaseAdmin.from("site_styles").select("*").limit(1).maybeSingle(),
      getMasterSiteInfoRow(),
    ]);

    const data = stylesRes.data || null;
    const savedVisualCfg = siteRow?.homepage_layout_config?.visual_styles_config || {};
    const rawCss = data?.custom_css ?? savedVisualCfg.custom_css ?? "";
    const embeddedMeta = extractEmbeddedMetaFromCss(rawCss);

    const resolvedPrimary =
      data?.primary_color || savedVisualCfg.primary_color || "#0071e3";
    const resolvedSecondary =
      data?.secondary_color || savedVisualCfg.secondary_color || "#4f46e5";
    const resolvedFont =
      data?.font_family || savedVisualCfg.font_family || "Vazirmatn";
    const resolvedRadius =
      data?.border_radius || savedVisualCfg.border_radius || "1.5rem";

    const resolvedUserRawCss =
      savedVisualCfg.user_raw_css !== undefined
        ? String(savedVisualCfg.user_raw_css)
        : embeddedMeta.user_raw_css !== undefined
        ? String(embeddedMeta.user_raw_css)
        : extractUserRawCss(rawCss);

    const responseData = {
      primary_color: resolvedPrimary,
      secondary_color: resolvedSecondary,
      font_family: resolvedFont,
      border_radius: resolvedRadius,
      custom_css: rawCss,
      user_raw_css: resolvedUserRawCss,
      font_weight: Number(
        savedVisualCfg.font_weight ?? embeddedMeta.font_weight ?? DEFAULT_VISUAL_META.font_weight
      ),
      glass_blur_px: Number(
        savedVisualCfg.glass_blur_px ??
          embeddedMeta.glass_blur_px ??
          DEFAULT_VISUAL_META.glass_blur_px
      ),
      card_shadow_strength:
        savedVisualCfg.card_shadow_strength ||
        embeddedMeta.card_shadow_strength ||
        DEFAULT_VISUAL_META.card_shadow_strength,
      button_hover_scale: Number(
        savedVisualCfg.button_hover_scale ??
          embeddedMeta.button_hover_scale ??
          DEFAULT_VISUAL_META.button_hover_scale
      ),
      line_height_scale: Number(
        savedVisualCfg.line_height_scale ??
          embeddedMeta.line_height_scale ??
          DEFAULT_VISUAL_META.line_height_scale
      ),
      heading_tracking:
        savedVisualCfg.heading_tracking ||
        embeddedMeta.heading_tracking ||
        DEFAULT_VISUAL_META.heading_tracking,
      custom_fonts: Array.isArray(savedVisualCfg.custom_fonts)
        ? savedVisualCfg.custom_fonts
        : Array.isArray(embeddedMeta.custom_fonts)
        ? embeddedMeta.custom_fonts
        : [],
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const nowIso = new Date().toISOString();

    const primaryColor = String(body.primary_color || "#0071e3").trim();
    const secondaryColor = String(body.secondary_color || "#4f46e5").trim();
    const fontFamily = String(body.font_family || "Vazirmatn").trim();
    const borderRadius = String(body.border_radius || "1.5rem").trim();
    const customCss = String(body.custom_css || "").trim();

    const visualMeta = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: fontFamily,
      border_radius: borderRadius,
      custom_css: customCss,
      user_raw_css:
        body.user_raw_css !== undefined
          ? String(body.user_raw_css).trim()
          : extractUserRawCss(customCss),
      font_weight: Number(body.font_weight ?? 400),
      glass_blur_px: Number(body.glass_blur_px ?? 20),
      card_shadow_strength: body.card_shadow_strength || "medium",
      button_hover_scale: Number(body.button_hover_scale ?? 1.03),
      line_height_scale: Number(body.line_height_scale ?? 1.8),
      heading_tracking: String(body.heading_tracking || "-0.02em"),
      custom_fonts: Array.isArray(body.custom_fonts) ? body.custom_fonts : [],
      updated_at: nowIso,
    };

    const dbPayload = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: fontFamily,
      border_radius: borderRadius,
      custom_css: customCss,
      updated_at: nowIso,
    };

    const { data: existing } = await supabaseAdmin.from("site_styles").select("id").limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_styles").update(dbPayload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_styles").insert([dbPayload]);
    }

    // ذخیره همگام در site_info برای حفظ کامل متادیتای اسلایدرها و فونت‌های سفارشی
    try {
      const siteRow = await getMasterSiteInfoRow();
      const prevLayout = siteRow?.homepage_layout_config || {};
      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...prevLayout,
          visual_styles_config: visualMeta,
        },
        {}
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: "✓ استایل‌ها، تایپوگرافی و هویت بصری با موفقیت در دیتابیس ثبت و منتشر شد.",
      data: visualMeta,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}