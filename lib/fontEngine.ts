// File Path: lib/fontEngine.ts
/**
 * موتور مدیریت فونت‌های زنده و تزریق داینامیک تایپوگرافی جهانی به ساختار DOM
 * با پشتیبانی از وزن‌های ۱۰۰ تا ۹۰۰ و کش محلی
 */

export interface CustomFontItem {
  id: string;
  name: string;
  fontFamily: string;
  fontUrlOrBase64: string;
  format: "woff2" | "woff" | "truetype" | "opentype";
  weights: number[];
  isCustom: boolean;
}

export const PRESET_FONTS: CustomFontItem[] = [
  {
    id: "vazirmatn",
    name: "وزیرمتن (Vazirmatn - پیش‌فرض)",
    fontFamily: "Vazirmatn",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    isCustom: false,
  },
  {
    id: "yekanbakh",
    name: "یکان باخ مدرن (Yekan Bakh)",
    fontFamily: "YekanBakh",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [300, 400, 600, 700, 800, 900],
    isCustom: false,
  },
  {
    id: "iransansx",
    name: "ایران سنس ایکس (IRANSansX)",
    fontFamily: "IRANSansX",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [100, 300, 400, 500, 700, 800, 900],
    isCustom: false,
  },
  {
    id: "dana",
    name: "دانا (Dana)",
    fontFamily: "Dana",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [300, 400, 500, 600, 700, 800],
    isCustom: false,
  },
  {
    id: "shabnam",
    name: "شبنم (Shabnam)",
    fontFamily: "Shabnam",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [300, 400, 700],
    isCustom: false,
  },
  {
    id: "peyda",
    name: "پیدا (Peyda)",
    fontFamily: "Peyda",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [300, 400, 600, 700, 800, 900],
    isCustom: false,
  },
  {
    id: "sf-pro",
    name: "اپل تحریری (SF Pro Display)",
    fontFamily: "SF Pro Display",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [300, 400, 500, 600, 700, 800],
    isCustom: false,
  },
  {
    id: "inter",
    name: "اینتر بین‌المللی (Inter)",
    fontFamily: "Inter",
    fontUrlOrBase64: "",
    format: "woff2",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    isCustom: false,
  },
];

const LOCAL_FONTS_KEY = "axon_custom_typography_registry_v2026";

export const fontEngine = {
  getAllFonts(): CustomFontItem[] {
    if (typeof window === "undefined") return PRESET_FONTS;
    try {
      const stored = localStorage.getItem(LOCAL_FONTS_KEY);
      if (stored) {
        const custom: CustomFontItem[] = JSON.parse(stored);
        return [...PRESET_FONTS, ...custom.filter((c) => !PRESET_FONTS.some((p) => p.id === c.id))];
      }
    } catch {}
    return PRESET_FONTS;
  },

  registerCustomFont(font: CustomFontItem): boolean {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(LOCAL_FONTS_KEY);
      const current: CustomFontItem[] = stored ? JSON.parse(stored) : [];
      const updated = [font, ...current.filter((f) => f.id !== font.id)];
      localStorage.setItem(LOCAL_FONTS_KEY, JSON.stringify(updated));

      this.injectFontFace(font);
      window.dispatchEvent(new CustomEvent("fonts_updated", { detail: updated }));
      return true;
    } catch (e) {
      console.error("Font registry error:", e);
      return false;
    }
  },

  injectFontFace(font: CustomFontItem) {
    if (typeof window === "undefined" || !font.fontUrlOrBase64) return;
    const styleId = `font-face-${font.id}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      @font-face {
        font-family: '${font.fontFamily}';
        src: url('${font.fontUrlOrBase64}') format('${font.format}');
        font-weight: 100 900;
        font-display: swap;
      }
    `;
  },

  applyFontToTarget(fontFamily: string, targetSelector: string = "body") {
    if (typeof window === "undefined") return;
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (el) {
      el.style.fontFamily = `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    }
  },
};