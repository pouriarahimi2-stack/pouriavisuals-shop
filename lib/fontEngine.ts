// File Path: lib/fontEngine.ts
/**
 * موتور مدیریت فونت‌های زنده و تزریق داینامیک تایپوگرافی جهانی به ساختار DOM
 * با پشتیبانی از وزن‌های ۱۰۰ تا ۹۰۰، همگام‌سازی دیتابیس و کش محلی
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

export const PRESET_FONT_STYLESHEETS: Record<string, string> = {
  Vazirmatn:
    "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap",
  YekanBakh:
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
  IRANSansX:
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
  Dana: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
  Shabnam:
    "https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css",
  Peyda: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
  Samim:
    "https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist/font-face.css",
  Inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
};

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
  getCustomFonts(): CustomFontItem[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(LOCAL_FONTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => c && c.fontFamily && c.fontUrlOrBase64);
        }
      }
    } catch {}
    return [];
  },

  getAllFonts(): CustomFontItem[] {
    const custom = this.getCustomFonts();
    return [...PRESET_FONTS, ...custom.filter((c) => !PRESET_FONTS.some((p) => p.id === c.id))];
  },

  syncCustomFontsFromServer(serverFonts: CustomFontItem[]): CustomFontItem[] {
    if (typeof window === "undefined") return PRESET_FONTS;
    try {
      const localCustom = this.getCustomFonts();
      const map = new Map<string, CustomFontItem>();
      localCustom.forEach((f) => map.set(f.fontFamily, f));
      (Array.isArray(serverFonts) ? serverFonts : []).forEach((sf) => {
        if (sf && sf.fontFamily && sf.fontUrlOrBase64) {
          map.set(sf.fontFamily, { ...sf, isCustom: true });
        }
      });
      const mergedCustom = Array.from(map.values());
      try {
        localStorage.setItem(LOCAL_FONTS_KEY, JSON.stringify(mergedCustom));
      } catch {}
      mergedCustom.forEach((f) => this.injectFontFace(f));
    } catch {}
    return this.getAllFonts();
  },

  registerCustomFont(font: CustomFontItem): boolean {
    if (typeof window === "undefined") return false;
    try {
      const current = this.getCustomFonts();
      const updated = [
        font,
        ...current.filter((f) => f.id !== font.id && f.fontFamily !== font.fontFamily),
      ];
      try {
        localStorage.setItem(LOCAL_FONTS_KEY, JSON.stringify(updated));
      } catch {}

      this.injectFontFace(font);
      window.dispatchEvent(new CustomEvent("fonts_updated", { detail: updated }));
      return true;
    } catch (e) {
      console.error("Font registry error:", e);
      return false;
    }
  },

  removeCustomFont(fontIdOrFamily: string): CustomFontItem[] {
    if (typeof window === "undefined") return [];
    try {
      const current = this.getCustomFonts();
      const updated = current.filter(
        (f) => f.id !== fontIdOrFamily && f.fontFamily !== fontIdOrFamily
      );
      localStorage.setItem(LOCAL_FONTS_KEY, JSON.stringify(updated));
      const el = document.getElementById(`font-face-${fontIdOrFamily}`);
      if (el) el.remove();
      window.dispatchEvent(new CustomEvent("fonts_updated", { detail: updated }));
      return updated;
    } catch {
      return [];
    }
  },

  buildCustomFontsCssRules(fonts?: CustomFontItem[]): string {
    const list = Array.isArray(fonts) ? fonts : this.getCustomFonts();
    if (list.length === 0) return "";
    const rules = list
      .filter((f) => f && f.fontFamily && f.fontUrlOrBase64)
      .map(
        (f) =>
          `@font-face { font-family: '${f.fontFamily}'; src: url('${f.fontUrlOrBase64}') format('${
            f.format || "woff2"
          }'); font-weight: 100 900; font-display: swap; }`
      );
    if (rules.length === 0) return "";
    return [
      "/* === AXON CUSTOM FONTS START === */",
      ...rules,
      "/* === AXON CUSTOM FONTS END === */",
    ].join("\n");
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

  ensurePresetStylesheetLoaded(fontFamily: string) {
    if (typeof document === "undefined") return;
    const url = PRESET_FONT_STYLESHEETS[fontFamily];
    if (!url) return;
    const linkId = "axon-preset-font-" + fontFamily.replace(/\s+/g, "-").toLowerCase();
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  },

  applyFontToTarget(fontFamily: string, targetSelector: string = "body") {
    if (typeof window === "undefined") return;
    this.ensurePresetStylesheetLoaded(fontFamily);
    const customList = this.getCustomFonts();
    const matchedCustom = customList.find((c) => c.fontFamily === fontFamily);
    if (matchedCustom) {
      this.injectFontFace(matchedCustom);
    }

    const stack = `'${fontFamily}', Vazirmatn, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    document.documentElement.style.setProperty("--font-primary", stack);
    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (el) {
      el.style.fontFamily = stack;
    }
  },
};