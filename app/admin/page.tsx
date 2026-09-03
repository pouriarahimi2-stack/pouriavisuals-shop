"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import AdminOrders from "@/components/AdminOrders";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminInventoryManager from "@/components/AdminInventoryManager";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminCustomers from "@/components/admin/AdminCustomers";
import ContactMessagesManager from "@/components/admin/ContactMessagesManager";
import PageBuilder from "@/components/admin/PageBuilder";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import StyleFontManager from "@/components/admin/StyleFontManager";
import AdminAiSeoAutopilot from "@/components/admin/AdminAiSeoAutopilot";
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "products"
    | "inventory"
    | "ai_autopilot"
    | "news_radar"
    | "page_builder"
    | "blogs"
    | "coupons"
    | "customers"
    | "banners"
    | "menu"
    | "typography"
    | "orders"
    | "siteInfo"
    | "messages"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        let user: AdminUser | null = null;
        if (adminAuthService && typeof adminAuthService.getCurrentSession === "function") {
          user = await adminAuthService.getCurrentSession();
        }

        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          const localUser = localStorage.getItem("axon_admin_active_session_v2026");
          if (localUser) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(localUser));
          } else {
            setIsAuthenticated(false);
            router.replace("/admin/login");
          }
        }
      } catch {
        setIsAuthenticated(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();

    siteInfoService.getSiteInfo().then((info) => {
      if (info) {
        setSiteInfo(info);
        setSelectedMaintMode(info.maintenance_mode || "none");
      }
    });

    try {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme !== "light";
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}
  }, [router]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    if (nextDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const triggerGlobalSearch = () => {
    soundEngine.playClick();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  const handleSaveMaintenance = async () => {
    soundEngine.playClick();
    setIsSavingMaint(true);

    try {
      let maintenanceUntil: string | null = null;
      let durationMinutes: number | null = null;

      if (selectedMaintMode === "timed") {
        const totalMinutes = maintHours * 60 + maintMinutes;
        durationMinutes = totalMinutes;
        maintenanceUntil = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
      }

      const isAllowed = selectedMaintMode === "none";

      const updated = await siteInfoService.updateSiteInfo({
        maintenance_mode: selectedMaintMode,
        maintenance_until: maintenanceUntil || undefined,
        maintenance_duration_minutes: durationMinutes || undefined,
        allow_google_index: isAllowed,
        allowGoogleIndex: isAllowed,
      });

      if (updated) {
        setSiteInfo(updated);
        soundEngine.playSuccess();
        alert("✅ وضعیت ایندکس گوگل و حالت تعمیرات با موفقیت ذخیره و اعمال شد.");
        setShowMaintenanceModal(false);
      }
    } catch (e) {
      alert("خطا در ذخیره وضعیت تعمیرات.");
    } finally {
      setIsSavingMaint(false);
    }
  };

  const isSuper = currentUser?.role === "superadmin" || (currentUser?.role as any) === "super_admin";

  const navTabs = [
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
    { id: "ai_autopilot", label: "موتور سئوی خودمختار (GSC)", icon: "🤖", show: isSuper },
    { id: "news_radar", label: "جدیدترین اخبار تکنولوژی", icon: "📡", show: true },
    { id: "page_builder", label: "صفحه‌ساز اختصاصی", icon: "🏗️", show: isSuper },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", show: isSuper },
    { id: "messages", label: "صندوق پیام‌ها و مشاوره", icon: "📩", show: isSuper },
    { id: "coupons", label: "تخفیف‌ها و کوپن", icon: "🏷️", show: isSuper },
    { id: "customers", label: "باشگاه مخاطبان (CRM)", icon: "👥", show: isSuper },
    { id: "blogs", label: "مقالات تخصصی و سئو", icon: "📚", show: true },
    { id: "typography", label: "تایپوگرافی و فونت‌ها", icon: "🎨", show: isSuper },
    { id: "banners", label: "بنرها و اسلایدرها", icon: "🖼️", show: isSuper },
    { id: "menu", label: "منوها و دسته‌بندی‌ها", icon: "🔗", show: isSuper },
    { id: "siteInfo", label: "اطلاعات سایت و لوگوها", icon: "⚙️", show: isSuper },
  ].filter((t) => t.show);

  if (isAuthenticated === null) return null;

  const isSiteOnline = (siteInfo?.maintenance_mode || "none") === "none";
  const storeName = siteInfo?.site_name || siteInfo?.siteName || "آکسون | Axon";
  const logoUrl = siteInfo?.logo_url || siteInfo?.logoUrl;

  return (
    <div dir="rtl" className="min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans select-none text-[var(--text-primary)]">
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر کامل پیشخوان ادمین با تمامی دکمه‌ها، ابزارها و سوییچرها */}
      <header className="p-4 md:p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl text-[var(--accent-blue)] font-black">⚡</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)]">پیشخوان یکپارچه مدیریت فروشگاه آکسون</h1>
              <span className={`w-2.5 h-2.5 rounded-full ${isSiteOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]"}`} title={isSiteOnline ? "سایت آنلاین و ایندکس فعال است" : "حالت تعمیرات فعال است"} />
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-secondary)]">
              <span>مدیر فعال: <strong className="text-[var(--text-primary)]">{currentUser?.full_name || currentUser?.username}</strong></span>
              <span className="px-2 py-0.5 rounded-md bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] font-bold text-[10px]">
                {currentUser?.role === "superadmin" || (currentUser?.role as any) === "super_admin" ? "مدیر کل سیستم (Superadmin)" : "مدیر بخش"}
              </span>
            </div>
          </div>
        </div>

        {/* جعبه ابزار کامل دکمه‌های هدر ادمین */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* ۱. دکمه جستجوی سریع (Ctrl+K) */}
          <button
            onClick={triggerGlobalSearch}
            className="px-3.5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="جستجوی سریع در کل سیستم (کلید میانبر Ctrl + K)"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">جستجو</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-70">Ctrl+K</span>
          </button>

          {/* ۲. دکمه میانبر موتور سئوی هوش مصنوعی */}
          {isSuper && (
            <button
              onClick={() => { soundEngine.playClick(); setActiveTab("ai_autopilot"); }}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/30 text-[var(--accent-blue)] hover:bg-blue-600 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="موتور سئوی خودمختار سرچ‌کنسول"
            >
              <span>🤖</span>
              <span className="hidden sm:inline">موتور سئو GSC</span>
            </button>
          )}

          {/* ۳. دکمه وضعیت ایندکس گوگل و حالت تعمیرات */}
          {isSuper && (
            <button
              onClick={() => { soundEngine.playClick(); setShowMaintenanceModal(true); }}
              className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isSiteOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-500 hover:bg-rose-500/25 animate-pulse"
              }`}
              title="کنترل دسترسی خزنده‌های گوگل و وضعیت تعمیرات"
            >
              <span>🌐</span>
              <span>{isSiteOnline ? "ایندکس گوگل: فعال ✓" : "تعمیرات فعال (ایندکس قفل)"}</span>
            </button>
          )}

          {/* ۴. دکمه مشاهده زنده فروشگاه */}
          <a
            href="/"
            target="_blank"
            className="px-3.5 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs font-bold transition flex items-center gap-1.5 shadow-sm text-[var(--text-primary)]"
            title="مشاهده سایت در تب جدید"
          >
            <span>🏠</span>
            <span className="hidden sm:inline">مشاهده فروشگاه</span>
          </a>

          {/* ۵. سوییچر تغییر تم ادمین */}
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition cursor-pointer flex items-center justify-center shadow-sm text-[var(--text-primary)]"
            title={isDarkMode ? "تغییر به تم روشن" : "تغییر به تم تاریک"}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          {/* ۶. دکمه خروج از حساب ادمین */}
          <button
            onClick={() => {
              soundEngine.playClick();
              adminAuthService.logout();
              router.replace("/admin/login");
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="خروج از حساب کاربری مدیر"
          >
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* آمار زنده داشبورد */}
      <AdminDashboardStats />

      {/* پایش سلامت سرور و دیتابیس */}
      <AdminHealthGuard />

      {/* نوار تب‌های ۱۴ ماژول ادمین */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                  : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* محتوای ماژول فعال */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl">
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "inventory" && <AdminInventoryManager />}
        {activeTab === "ai_autopilot" && isSuper && <AdminAiSeoAutopilot />}
        {activeTab === "news_radar" && <AdminNewsManager />}
        {activeTab === "page_builder" && isSuper && <PageBuilder />}
        {activeTab === "blogs" && <AdminBlogManager />}
        {activeTab === "typography" && isSuper && <StyleFontManager />}
        {activeTab === "orders" && isSuper && <AdminOrders />}
        {activeTab === "messages" && isSuper && <ContactMessagesManager />}
        {activeTab === "coupons" && isSuper && <AdminCoupons />}
        {activeTab === "customers" && isSuper && <AdminCustomers />}
        {activeTab === "banners" && isSuper && <AdminBanners />}
        {activeTab === "menu" && isSuper && <AdminMenu />}
        {activeTab === "siteInfo" && isSuper && <AdminSiteInfo />}
      </div>

      {/* مودال جامع ایندکس گوگل و وضعیت تعمیرات */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-5 shadow-2xl text-xs text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                <h3 className="font-black text-sm text-[var(--accent-blue)]">تنظیمات ایندکس گوگل و وضعیت تعمیرات سایت</h3>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                وضعیت دسترسی خزنده‌های گوگل (Googlebot) و کاربران به سایت را تنظیم فرمایید:
              </p>

              <div className="space-y-2">
                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${selectedMaintMode === "none" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "none"} onChange={() => setSelectedMaintMode("none")} className="accent-emerald-500" />
                    <div>
                      <span className="font-black block">۱. سایت کاملاً فعال و آنلاین (پیش‌فرض)</span>
                      <span className="text-[10px] opacity-75">خزش و ایندکس گوگل ۱۰۰٪ فعال و تمامی صفحات در دسترس هستند.</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold">آنلاین ✓</span>
                </label>

                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${selectedMaintMode === "timed" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "timed"} onChange={() => setSelectedMaintMode("timed")} className="accent-amber-500" />
                    <div>
                      <span className="font-black block">۲. حالت تعمیرات زمان‌دار (با تایمر شمارنده معکوس)</span>
                      <span className="text-[10px] opacity-75">نمایش شمارنده معکوس تا پایان زمان مشخص و غیرفعال‌سازی موقت ایندکس.</span>
                    </div>
                  </div>
                  <span className="text-amber-500 font-bold">زمان‌دار ⏳</span>
                </label>

                <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${selectedMaintMode === "indefinite" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "indefinite"} onChange={() => setSelectedMaintMode("indefinite")} className="accent-rose-500" />
                    <div>
                      <span className="font-black block">۳. حالت تعمیرات نامحدود (توقف کامل ایندکس)</span>
                      <span className="text-[10px] opacity-75">خروج موقت از دسترس جهت اعمال تغییرات ساختاری در دیتابیس.</span>
                    </div>
                  </div>
                  <span className="text-rose-500 font-bold">قفل 🔒</span>
                </label>
              </div>

              {selectedMaintMode === "timed" && (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-amber-500/30 space-y-2 animate-fadeIn">
                  <span className="font-bold text-[var(--text-secondary)] block">مدت زمان تقریبی تعمیرات:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">ساعت:</label>
                      <input type="number" min="0" max="72" value={maintHours} onChange={(e) => setMaintHours(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">دقیقه:</label>
                      <input type="number" min="0" max="59" value={maintMinutes} onChange={(e) => setMaintMinutes(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSavingMaint}
                onClick={handleSaveMaintenance}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSavingMaint ? "در حال اعمال..." : "ذخیره و اعمال وضعیت 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
