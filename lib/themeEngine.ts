// File Path: lib/themeEngine.ts
export const themeEngine = {
  getSystemTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "light";
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  },

  getRecommendedTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "light";
    try {
      const isManual = sessionStorage.getItem("axon_theme_manual_override") === "true";
      const savedTheme = localStorage.getItem("theme");
      if (isManual && (savedTheme === "dark" || savedTheme === "light")) {
        return savedTheme;
      }
      return this.getSystemTheme();
    } catch {
      return this.getSystemTheme();
    }
  },

  applyTheme(theme?: "dark" | "light", isManualUserAction: boolean = false) {
    if (typeof window === "undefined") return;

    const targetTheme = theme || this.getRecommendedTheme();

    try {
      if (isManualUserAction) {
        sessionStorage.setItem("axon_theme_manual_override", "true");
      }
      localStorage.setItem("theme", targetTheme);
    } catch {}

    const root = document.documentElement;
    if (targetTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    window.dispatchEvent(new CustomEvent("theme_changed", { detail: targetTheme }));
  },

  initThemeListener() {
    if (typeof window === "undefined") return;
    this.applyTheme();

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        // اگر کاربر سیستم‌عامل خود را بین Dark و Light تغییر دهد، سایت بلافاصله با سیستم هماهنگ می‌شود
        sessionStorage.removeItem("axon_theme_manual_override");
        this.applyTheme(e.matches ? "dark" : "light", false);
      };

      try {
        mediaQuery.addEventListener("change", handleChange);
      } catch {
        mediaQuery.addListener(handleChange);
      }
    }
  },
};

export default themeEngine;
