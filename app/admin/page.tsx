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
import { SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";
import { realtimeEngine } from "@/lib/realtimeSync";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "products"
    | "inventory"
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

  // مودال وضعیت آنلاین / تعمیرات
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  // مودال تغییر مشخصات و رمز عبور
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("superadmin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // مودال مدیریت ادمین‌ها
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("product_manager");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminCreateMsg, setAdminCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const fetchSiteInfoLive = async () => {
    try {
      const res = await fetch("/api/site-info", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSiteInfo(json.data);
          setSelectedMaintMode(json.data.maintenance_mode || "none");
        }
      }
    } catch (e) {
      console.error("Admin SiteInfo fetch error:", e);
    }
  };

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
          setNewUsername(user.username || "");
          setNewFullName(user.full_name || "");
          setNewRole(user.role || "superadmin");

          if (user.role === "content_editor") {
            setActiveTab("blogs");
          } else if (user.role === "product_manager") {
            setActiveTab("products");
          }
        } else {
          const localUser = localStorage.getItem("axon_admin_active_session_v2026");
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setIsAuthenticated(true);
              setCurrentUser(parsed);
              setNewUsername(parsed.username || "");
              setNewFullName(parsed.full_name || "");
              setNewRole(parsed.role || "superadmin");
            } catch {
              setIsAuthenticated(false);
              router.replace("/admin/login");
            }
          } else {
            setIsAuthenticated(false);
            router.replace("/admin/login");
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();
    fetchSiteInfoLive();

    const handleSiteUpdate = () => fetchSiteInfoLive();
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, [router]);

  const toggleDarkMode = () => {
    soundEngine.playClick();
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const handleSaveMaintenanceMode = async () => {
    soundEngine.playClick();
    setIsSavingMaint(true);
    let untilISO: string | null = null;
    const totalMinutes = Number(maintHours) * 60 + Number(maintMinutes);

    if (selectedMaintMode === "timed") {
      untilISO = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
    }

    const payload = {
      maintenance_mode: selectedMaintMode,
      maintenance_until: untilISO,
      maintenance_duration_minutes: selectedMaintMode === "timed" ? totalMinutes : null,
      allow_google_index: selectedMaintMode === "none",
      allowGoogleIndex: selectedMaintMode === "none",
    };

    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const finalData = json.data || payload;

      // انتشار آنی برودکست برای اعمال بدون رفرش
      realtimeEngine.broadcastLocally("site_info_updated", finalData);
      setSiteInfo(finalData);
    } finally {
      setIsSavingMaint(false);
      setShowMaintenanceModal(false);
    }
  };

  const loadAllAdmins = async () => {
    try {
      const list = await adminAuthService.getAllAdmins();
      setAdminList(Array.isArray(list) ? list : []);
    } catch {
      setAdminList([]);
    }
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await adminAuthService.logout();
    } catch {}
    router.replace("/admin/login");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "رمز عبور جدید و تکرار آن یکسان نیستند." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const targetId = currentUser?.id || "admin_master";
      const res = await adminAuthService.updateCredentials(
        targetId,
        newUsername,
        newPassword || undefined,
        newFullName || undefined,
        newRole
      );

      if (res && res.success) {
        soundEngine.playSuccess();
        setPasswordMsg({ type: "success", text: "✨ مشخصات، سطح دسترسی و کلمه عبور با موفقیت در دیتابیس ثبت شد." });
        if (currentUser) {
          const updatedUser: AdminUser = {
            ...currentUser,
            username: newUsername,
            full_name: newFullName || currentUser.full_name,
            role: newRole,
          };
          setCurrentUser(updatedUser);
          localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(updatedUser));
        }
        setTimeout(() => setShowPasswordModal(false), 1800);
      } else {
        setPasswordMsg({ type: "error", text: res?.message || "خطا در ذخیره‌سازی مشخصات." });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "خطا در برقراری ارتباط." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateMsg(null);

    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      setAdminCreateMsg({ type: "error", text: "نام کاربری و رمز عبور الزامی است." });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const res = await adminAuthService.createAdmin({
        username: newAdminUsername,
        password: newAdminPassword,
        full_name: newAdminFullName || newAdminUsername,
        role: newAdminRole,
      });

      if (res && res.success) {
        soundEngine.playSuccess();
        setAdminCreateMsg({ type: "success", text: "🎉 ادمین جدید با موفقیت در دیتابیس ایجاد گردید." });
        setNewAdminUsername("");
        setNewAdminPassword("");
        setNewAdminFullName("");
        loadAllAdmins();
      } else {
        setAdminCreateMsg({ type: "error", text: res?.message || "خطا در ایجاد ادمین." });
      }
    } catch {
      setAdminCreateMsg({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (confirm(`آیا از حذف دسترسی ادمین "${username}" اطمینان دارید؟`)) {
      soundEngine.playClick();
      await adminAuthService.deleteAdmin(adminId);
      loadAllAdmins();
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-200 text-xs font-bold font-sans">
        در حال اعتبارسنجی سطح دسترسی...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentMode: MaintenanceMode = siteInfo?.maintenance_mode || (siteInfo?.allow_google_index === false ? "indefinite" : "none");
  const isSuper = currentUser?.role === "superadmin" || (currentUser?.role as any) === "super_admin";
  const userRole = (currentUser?.role || "superadmin") as AdminRole;

  const getRoleBadge = (role: AdminRole | string) => {
    if (role === "superadmin" || role === "super_admin") {
      return <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 font-black text-[10px]">👑 مدیر کل سیستم</span>;
    }
    if (role === "product_manager" || role === "inventory_manager") {
      return <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-[10px]">📦 مدیر انبار و کالا</span>;
    }
    if (role === "content_editor") {
      return <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-[10px]">✍️ ویراستار مقالات سئو</span>;
    }
    return <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 font-black text-[10px]">👁️ ناظر (Viewer)</span>;
  };

  const navTabs = [
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
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
    { id: "siteInfo", label: "اطلاعات سایت و ایندکس", icon: "⚙️", show: isSuper },
  ].filter((t) => t.show);

  return (
    <div
      dir="rtl"
      className={`min-h-screen p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans transition-colors duration-300 select-none ${
        isDarkMode ? "bg-[#070b14] text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
      style={
        {
          "--bg-primary": isDarkMode ? "#070b14" : "#f1f5f9",
          "--modal-bg": isDarkMode ? "#0f172a" : "#ffffff",
          "--input-bg": isDarkMode ? "#1e293b" : "#f8fafc",
          "--card-border": isDarkMode ? "#334155" : "#e2e8f0",
          "--text-primary": isDarkMode ? "#f8fafc" : "#0f172a",
          "--text-secondary": isDarkMode ? "#94a3b8" : "#64748b",
          "--accent-blue": "#3b82f6",
        } as React.CSSProperties
      }
    >
      <AdminGlobalSearch onSelectTab={(t: any) => setActiveTab(t)} />

      {/* هدر یکپارچه پیشخوان با کنترل زنده وضعیت سایت */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[var(--text-primary)]">کنترل پنل مهندسی‌شده فروشگاه</h1>
              
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowMaintenanceModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-blue-500 transition cursor-pointer shadow-sm"
                title="کلیک جهت تنظیم وضعیت سایت"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentMode === "none"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                      : currentMode === "timed"
                      ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-ping"
                      : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  }`}
                />
                <span className="text-[11px] text-[var(--text-primary)] font-bold">
                  {currentMode === "none"
                    ? "سایت آنلاین (ایندکس فعال) ✓"
                    : currentMode === "timed"
                    ? "تعمیرات زمان‌دار (تایمر فعال) ⏱️"
                    : "حالت تعمیر نامحدود (قفل کامل) 🔒"}
                </span>
              </button>
              {getRoleBadge(userRole)}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              مدیر آنلاین: <strong className="text-[var(--text-primary)]">{currentUser?.full_name || currentUser?.username}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuper && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowAdminManagerModal(true);
                loadAllAdmins();
              }}
              className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>👥</span>
              <span>مدیریت ادمین‌ها</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              setPasswordMsg(null);
              setShowPasswordModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🔐</span>
            <span>تغییر مشخصات و رمز</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] transition cursor-pointer text-xs shadow-sm font-bold flex items-center justify-center"
            title="تم شب / روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <a
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-2xl bg-[var(--input-bg)] hover:border-blue-500 border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            🏠 مشاهده سایت
          </a>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            🚪 خروج
          </button>
        </div>
      </header>

      {userRole !== "content_editor" && (
        <div className="space-y-4">
          <AdminDashboardStats />
          <AdminHealthGuard />
        </div>
      )}

      {/* نوار تب‌های پیشخوان */}
      <div className="p-3 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                    : "bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 border border-[var(--card-border)]"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای تب فعال */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl backdrop-blur-md">
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "inventory" && <AdminInventoryManager />}
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

      {/* مدال کنترل وضعیت آنلاین / تعمیرات */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-lg w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-6 shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-lg">
                  🛠️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text-primary)]">تنظیمات وضعیت سایت و ایندکس گوگل</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">کنترل زنده نمایش سایت برای کاربران و موتورهای جستجو</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                onClick={() => setSelectedMaintMode("none")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  selectedMaintMode === "none"
                    ? "bg-emerald-500/10 border-emerald-500 text-[var(--text-primary)] ring-2 ring-emerald-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }`}
              >
                <input type="radio" checked={selectedMaintMode === "none"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-1">
                  <strong className="block font-black text-[var(--text-primary)]">۱. سایت آنلاین و فعال (حالت عادی)</strong>
                  <p className="text-[11px] leading-relaxed">سایت برای تمام کاربران و موتورهای جستجوی گوگل فعال است.</p>
                </div>
              </div>

              <div
                onClick={() => setSelectedMaintMode("timed")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  selectedMaintMode === "timed"
                    ? "bg-amber-500/10 border-amber-500 text-[var(--text-primary)] ring-2 ring-amber-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }`}
              >
                <input type="radio" checked={selectedMaintMode === "timed"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-2 flex-1">
                  <strong className="block font-black text-[var(--text-primary)]">۲. حالت تعمیرات زمان‌دار (با تایمر)</strong>
                  <p className="text-[11px] leading-relaxed">
                    سایت بسته شده و شمارنده معکوس نشان داده می‌شود. پس از پایان زمان، سایت خودکار باز می‌شود.
                  </p>

                  {selectedMaintMode === "timed" && (
                    <div className="pt-2 border-t border-[var(--card-border)] flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">مدت زمان (ساعت):</label>
                        <input
                          type="number"
                          min={0}
                          max={72}
                          value={maintHours}
                          onChange={(e) => setMaintHours(Number(e.target.value))}
                          className="w-20 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">دقیقه اضافی:</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={maintMinutes}
                          onChange={(e) => setMaintMinutes(Number(e.target.value))}
                          className="w-20 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                onClick={() => setSelectedMaintMode("indefinite")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  selectedMaintMode === "indefinite"
                    ? "bg-rose-500/10 border-rose-500 text-[var(--text-primary)] ring-2 ring-rose-500/20"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:border-slate-500"
                }`}
              >
                <input type="radio" checked={selectedMaintMode === "indefinite"} onChange={() => {}} className="mt-1 cursor-pointer" />
                <div className="space-y-1">
                  <strong className="block font-black text-[var(--text-primary)]">۳. حالت تعمیرات نامحدود (قفل کامل سایت)</strong>
                  <p className="text-[11px] leading-relaxed">
                    سایت برای کاربر و گوگل بسته می‌ماند تا زمانی که ادمین وضعیت را به آنلاین تغییر دهد.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:opacity-80 font-bold cursor-pointer text-[var(--text-secondary)] transition text-xs border border-[var(--card-border)]"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSavingMaint}
                onClick={handleSaveMaintenanceMode}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition cursor-pointer shadow-lg disabled:opacity-50 text-xs"
              >
                {isSavingMaint ? "در حال اعمال..." : "ذخیره و اعمال سراسری ⚡"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
