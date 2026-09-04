// File Path: lib/themeEngine.ts
/**
 * موتور هوشمند تشخیص تم روز و شب بر اساس ساعت محلی سیستم
 * روز (۶:۰۰ تا ۱۸:۳۰) = تم سفید روشن
 * شب (۱۸:۳۰ تا ۶:۰۰) = تم مشکی تاریک
 */

export const themeEngine = {
  isNightTime(): boolean {
    const hours = new Date().getHours();
    const minutes = new Date().getMinutes();
    const current = hours + minutes / 60;
    return current >= 18.5 || current < 6.0;
  },

  getRecommendedTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "dark";

    try {
      const isManual = localStorage.getItem("axon_theme_manual_override") === "true";
      const savedTheme = localStorage.getItem("theme");

      if (isManual && (savedTheme === "dark" || savedTheme === "light")) {
        return savedTheme;
      }

      if (this.isNightTime()) {
        return "dark";
      }

      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }

      return "light";
    } catch {
      return "dark";
    }
  },

  applyTheme(theme?: "dark" | "light", isManualUserAction: boolean = false) {
    if (typeof window === "undefined") return;

    const targetTheme = theme || this.getRecommendedTheme();

    if (isManualUserAction) {
      localStorage.setItem("axon_theme_manual_override", "true");
      localStorage.setItem("theme", targetTheme);
    } else {
      localStorage.setItem("theme", targetTheme);
    }

    if (targetTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    window.dispatchEvent(new CustomEvent("theme_changed", { detail: targetTheme }));
  },

  resetToAutomatic() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("axon_theme_manual_override");
    this.applyTheme(undefined, false);
  }
};

export default themeEngine;
