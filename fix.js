// File Path: fix.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 [AXON ARCHITECT] در حال اتصال ماژول حساب‌های مدیران و تغییر رمز (AdminAccountsManager) به تب‌های پیشخوان و کلیک‌پذیر کردن پروفایل ادمین...');

const files = {
  // ۱. صفحه پیشخوان ادمین مجهز به تب رسمی مدیریت حساب‌های مدیران و تغییر رمز عبور
  'app/admin/page.tsx': `"use client";

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
import AdminAccountsManager from "@/components/AdminAccountsManager";
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
    | "accounts"
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
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
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
    { id: "accounts", label: "حساب‌های مدیران و تغییر رمز", icon: "🛡️", show: isSuper },
    { id: "siteInfo", label: "اطلاعات سایت و ایندکس", icon: "⚙️", show: isSuper },
  ].filter((t) => t.show);

  if (isAuthenticated === null) return null;

  return (
    <div dir="rtl" className="min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans select-none text-[var(--text-primary)]">
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر تمیز و استاندارد ادمین با پروفایل کلیک‌پذیر */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)]">پیشخوان یکپارچه مدیریت فروشگاه آکسون</h1>
            
            {/* دکمه پروفایل مدیر آنلاین (کلیک جهت هدایت سریع به صفحه تغییر رمز و حساب‌ها) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab("accounts");
              }}
              className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition cursor-pointer group"
              title="کلیک کنید تا به بخش ویرایش مشخصات و تغییر رمز هدایت شوید"
            >
              <span>مدیر آنلاین:</span>
              <strong className="text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition underline decoration-dotted underline-offset-4">
                {currentUser?.full_name || currentUser?.username}
              </strong>
              <span className="text-[10px] opacity-70">✏️</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* دکمه ایندکس گوگل و حالت تعمیرات */}
          {isSuper && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowMaintenanceModal(true);
              }}
              className={\`px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer \${
                selectedMaintMode === "none"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 animate-pulse"
              }\`}
            >
              <span>🌐</span>
              <span>{selectedMaintMode === "none" ? "ایندکس گوگل: مجاز ✓" : "تعمیرات فعال (توقف ایندکس)"}</span>
            </button>
          )}

          <a href="/" target="_blank" className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[var(--accent-blue)] transition flex items-center gap-1">
            <span>🏠</span>
            <span>مشاهده فروشگاه</span>
          </a>

          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-xs transition cursor-pointer flex items-center justify-center shadow-sm"
            title="تغییر تم"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <button
            onClick={() => {
              adminAuthService.logout();
              router.replace("/admin/login");
            }}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold cursor-pointer transition flex items-center gap-1"
          >
            <span>🚪</span>
            <span>خروج</span>
          </button>
        </div>
      </header>

      <AdminDashboardStats />
      <AdminHealthGuard />

      {/* نوار تب‌های ماژول‌های ادمین شامل تب اختصاصی حساب‌ها و تغییر رمز */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id as any);
              }}
              className={\`px-3.5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 \${
                activeTab === tab.id
                  ? "bg-[var(--accent-blue)] text-white shadow-lg scale-105"
                  : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]"
              }\`}
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
        {activeTab === "accounts" && isSuper && <AdminAccountsManager />}
        {activeTab === "siteInfo" && isSuper && <AdminSiteInfo />}
      </div>

      {/* مودال ایندکس گوگل و حالت تعمیرات */}
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
                وضعیت دسترسی خزنده‌های گوگل (Googlebot) و کاربران به سایت را تعیین فرمایید:
              </p>

              <div className="space-y-2">
                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "none" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "none"} onChange={() => setSelectedMaintMode("none")} className="accent-emerald-500" />
                    <div>
                      <span className="font-black block">۱. سایت کاملاً فعال و آنلاین (پیش‌فرض)</span>
                      <span className="text-[10px] opacity-75">خزش و ایندکس گوگل ۱۰۰٪ مجاز و تمامی صفحات در دسترس هستند.</span>
                    </div>
                  </div>
                  <span className="text-emerald-500 font-bold">آنلاین ✓</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "timed" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "timed"} onChange={() => setSelectedMaintMode("timed")} className="accent-amber-500" />
                    <div>
                      <span className="font-black block">۲. حالت تعمیرات زمان‌دار (با تایمر شمارنده معکوس)</span>
                      <span className="text-[10px] opacity-75">نمایش صفحه شمارش معکوس به کاربران تا پایان زمان مشخص.</span>
                    </div>
                  </div>
                  <span className="text-amber-500 font-bold">زمان‌دار ⏳</span>
                </label>

                <label className={\`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition \${selectedMaintMode === "indefinite" ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "border-[var(--card-border)] bg-[var(--input-bg)]"}\`}>
                  <div className="flex items-center gap-2.5">
                    <input type="radio" name="maint" checked={selectedMaintMode === "indefinite"} onChange={() => setSelectedMaintMode("indefinite")} className="accent-rose-500" />
                    <div>
                      <span className="font-black block">۳. حالت تعمیرات نامحدود (توقف موقت ایندکس)</span>
                      <span className="text-[10px] opacity-75">خروج موقت از دسترس جهت اعمال تغییرات اساسی دیتابیس.</span>
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
`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ [UPDATED] ماژول حساب‌های مدیران با موفقیت متصل شد: ${filePath}`);
}

console.log('📦 در حال Push به گیت‌هاب و دیپلوی خودکار روی Vercel...');
try {
  execSync('git add . && git commit -m "feat: link AdminAccountsManager tab and make admin profile badge clickable to manage password" && git push origin main', { stdio: 'inherit' });
  console.log('🎉 [DEPLOYED] استقرار نهایی با موفقیت ۱۰۰٪ کامل شد!');
} catch (e) {
  console.log('⚠️ دستور دستی: git push origin main');
}