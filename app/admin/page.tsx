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
import { siteInfoService, SiteInfo, MaintenanceMode } from "@/services/siteInfoService";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { productService, Product } from "@/services/productService";
import { supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/soundEngine";

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
    | "orders"
    | "siteInfo"
    | "messages"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  // مدال کنترل وضعیت آنلاین / تعمیرات زمان‌دار / تعمیرات نامحدود
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintMode, setSelectedMaintMode] = useState<MaintenanceMode>("none");
  const [maintHours, setMaintHours] = useState<number>(1);
  const [maintMinutes, setMaintMinutes] = useState<number>(0);
  const [isSavingMaint, setIsSavingMaint] = useState(false);

  // مدال‌های تغییر کلمه عبور و مدیریت حساب‌های ادمین
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("product_manager");
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

          if (user.role === "content_editor") {
            setActiveTab("blogs");
          } else if (user.role === "product_manager") {
            setActiveTab("products");
          }
        } else {
          const localUser = localStorage.getItem("admin_current_user");
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              setIsAuthenticated(true);
              setCurrentUser(parsed);
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

    const channel = supabase
      .channel("admin-siteinfo-realtime-master-v2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => fetchSiteInfoLive())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await fetchSiteInfoLive();
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
        newFullName || undefined
      );

      if (res && res.success) {
        soundEngine.playSuccess();
        setPasswordMsg({ type: "success", text: "✨ مشخصات و کلمه عبور با موفقیت به‌روزرسانی شد." });
        if (currentUser) {
          const updatedUser = { ...currentUser, username: newUsername, full_name: newFullName || currentUser.full_name };
          setCurrentUser(updatedUser);
          localStorage.setItem("admin_current_user", JSON.stringify(updatedUser));
        }
        setTimeout(() => setShowPasswordModal(false), 1800);
      } else {
        setPasswordMsg({ type: "error", text: res?.message || "خطا در تغییر مشخصات." });
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
        setAdminCreateMsg({ type: "success", text: "🎉 ادمین جدید با موفقیت ایجاد گردید." });
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
    return <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-[10px]">✍️ ویراستار مقالات سئو</span>;
  };

  const navTabs = [
    { id: "products", label: "محصولات و کاتالوگ", icon: "📦", show: true },
    { id: "inventory", label: "انبارداری سریع", icon: "📥", show: true },
    { id: "news_radar", label: "رادار اخبار جهانی و گجت‌ها", icon: "📡", show: true },
    { id: "page_builder", label: "صفحه‌ساز اختصاصی", icon: "🏗️", show: isSuper },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", show: isSuper },
    { id: "messages", label: "صندوق پیام‌ها و مشاوره", icon: "📩", show: isSuper },
    { id: "coupons", label: "تخفیف‌ها و کوپن", icon: "🏷️", show: isSuper },
    { id: "customers", label: "باشگاه مخاطبان", icon: "👥", show: isSuper },
    { id: "blogs", label: "مقالات تخصصی و سئو", icon: "📚", show: true },
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

      {/* هدر پیشخوان ادمین */}
      <header className="p-4 md:p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-[var(--text-primary)]">کنترل پنل مهندسی‌شده فروشگاه</h1>
              
              {/* کلید کنترل زنده حالت تعمیرات */}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowMaintenanceModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-blue-500 transition cursor-pointer shadow-sm"
                title="کلیک جهت تنظیم حالت آنلاین یا تعمیرات زمان‌دار"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentMode === "none"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
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
                    : "حالت تعمیر نامحدود (سایت قفل) 🔒"}
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
            <span>تغییر رمز</span>
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

      {/* نوار تب‌های مدیریت */}
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
        {activeTab === "orders" && isSuper && <AdminOrders />}
        {activeTab === "messages" && isSuper && <ContactMessagesManager />}
        {activeTab === "coupons" && isSuper && <AdminCoupons />}
        {activeTab === "customers" && isSuper && <AdminCustomers />}
        {activeTab === "banners" && isSuper && <AdminBanners />}
        {activeTab === "menu" && isSuper && <AdminMenu />}
        {activeTab === "siteInfo" && isSuper && <AdminSiteInfo />}
      </div>

      {/* دستیار هوشمند و تحلیلگر کاتالوگ ادمین */}
      {isSuper && <AdminAIAssistant />}

      {/* مدال کنترل وضعیت آنلاین / تعمیرات زمان‌دار */}
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
                  <p className="text-[11px] leading-relaxed">سایت برای تمام کاربران و موتورهای جستجوی گوگل فعال و در دسترس است.</p>
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
                  <strong className="block font-black text-[var(--text-primary)]">۲. حالت تعمیرات زمان‌دار (با شمارنده معکوس)</strong>
                  <p className="text-[11px] leading-relaxed">
                    سایت بسته شده و شمارنده معکوس لایو به کاربر نشان داده می‌شود. با اتمام تایمر، سایت به صورت خودکار باز می‌شود.
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
                    سایت هم برای کاربر و هم برای گوگل مخفی می‌شود تا زمانی که ادمین دوباره آن را به حالت آنلاین تغییر دهد.
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
                {isSavingMaint ? "در حال اعمال فوری..." : "ذخیره و اعمال زنده در سراسر سایت ⚡"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال تغییر رمز عبور */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-5 shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                  🔐
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text-primary)]">تغییر مشخصات و کلمه عبور</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">امنیت دسترسی حساب مدیریت</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-500"
                }`}
              >
                <span>{passwordMsg.type === "success" ? "✓" : "⚠️"}</span>
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام نمایشی:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثلاً: پوریا"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-blue-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام کاربری لاگین:</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono font-bold focus:border-blue-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمه عبور جدید:</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر..."
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono focus:border-blue-500 transition text-xs pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
                  >
                    {showNewPass ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور جدید:</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز جدید..."
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono focus:border-blue-500 transition text-xs pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
                  >
                    {showConfirmPass ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:opacity-80 font-bold cursor-pointer text-[var(--text-secondary)] transition text-xs border border-[var(--card-border)]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white font-black transition cursor-pointer shadow-lg disabled:opacity-50 text-xs hover:bg-blue-700"
                >
                  {isUpdatingPassword ? "در حال ثبت..." : "ذخیره مشخصات 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال مدیریت ادمین‌ها */}
      {showAdminManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-7 space-y-6 shadow-2xl text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg">
                  👥
                </div>
                <div>
                  <h3 className="font-black text-sm text-[var(--text-primary)]">سامانه مدیریت ادمین‌ها و سطوح دسترسی</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">تفکیک وظایف نویسنده مقالات و مدیر انبار</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminManagerModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
              <span className="font-extrabold text-xs text-blue-500 block">➕ ساخت ادمین جدید:</span>

              {adminCreateMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    adminCreateMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-500"
                  }`}
                >
                  <span>{adminCreateMsg.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{adminCreateMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: علی رضایی"
                    value={newAdminFullName}
                    onChange={(e) => setNewAdminFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">سطح دسترسی (Role):</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="product_manager">📦 مدیر کالا (فقط محصولات و کاتالوگ)</option>
                    <option value="content_editor">✍️ نویسنده (فقط مقالات سئو)</option>
                    <option value="super_admin">👑 مدیر کل سیستم (دسترسی کامل)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام کاربری جهت ورود:</label>
                  <input
                    type="text"
                    required
                    placeholder="username..."
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono font-bold focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمه عبور ورود:</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-mono focus:border-blue-500 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
                    >
                      {showAdminPass ? "👁️‍🗨️" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreatingAdmin ? "در حال ایجاد..." : "افزودن ادمین جدید 🚀"}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <span className="font-bold text-xs text-[var(--text-secondary)] block">لیست مدیران فعال:</span>
              <div className="space-y-2">
                {adminList.map((adm) => (
                  <div
                    key={adm.id}
                    className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-[var(--text-primary)] font-black">{adm.full_name}</strong>
                        <span className="font-mono text-[var(--text-secondary)] text-[11px]">({adm.username})</span>
                      </div>
                      <div>{getRoleBadge(adm.role)}</div>
                    </div>

                    {adm.username !== currentUser?.username && (
                      <button
                        onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectorModalOpen, setSelectorModalOpen] = useState(false);
  const [input, setInput] = useState("");

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [messages, setMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([
    {
      role: "model",
      text: "سلام مدیر گرامی! 👋\nبرای بررسی دقیق کالاها و استراتژی قیمت یا تولید مقالات، روی «🎯 انتخاب محصولات برای آنالیز/سئو» کلیک نمایید.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [articleToPublish, setArticleToPublish] = useState({
    title: "",
    metaDescription: "",
    keywords: "",
    content: "",
  });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function initAssistant() {
      try {
        const prods = (await productService.getAll()) || [];
        const validProds = Array.isArray(prods) ? prods : [];
        setProductsList(validProds);

        const cats = Array.from(
          new Set(validProds.map((p: any) => p.category_id || p.category || p.category_name || "عمومی"))
        ).filter(Boolean) as string[];
        setCategories(cats);
      } catch (e) {
        console.error("AI assistant load error:", e);
      }
    }
    if (isOpen || selectorModalOpen) {
      initAssistant();
    }
  }, [isOpen, selectorModalOpen]);

  const categoryProducts = selectedCategory === "all"
    ? productsList
    : productsList.filter((p: any) => (p.category || p.category_name || p.category_id || "عمومی") === selectedCategory);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllCategory = () => {
    const currentCatIds = categoryProducts.map((p) => String(p.id));
    const allSelected = currentCatIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !currentCatIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...currentCatIds])));
    }
  };

  const handleSelectAllSite = () => {
    if (selectedProductIds.length === productsList.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(productsList.map((p) => String(p.id)));
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const query = customPrompt || input;
    if (!query.trim() || loading || selectedProductIds.length === 0) return;

    if (!customPrompt) setInput("");

    const updatedMessages = [...messages, { role: "user" as const, text: query }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const targetProducts = productsList.filter((p) => selectedProductIds.includes(String(p.id)));

      const validHistory = updatedMessages
        .slice(0, -1)
        .filter((m, index) => !(index === 0 && m.role === "model"))
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          role: "admin",
          productsData: targetProducts,
          history: validHistory,
        }),
      });

      const data = await res.json();
      if (data && (data.response || data.reply)) {
        setMessages((prev) => [...prev, { role: "model", text: data.response || data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "متأسفانه در حال حاضر ارتباط با دستیار برقرار نشد." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarketAnalysis = () => {
    setSelectorModalOpen(false);
    const targetProducts = productsList.filter((p) => selectedProductIds.includes(String(p.id)));
    const names = targetProducts.map((p: any) => p.name || p.title || p.title_fa).join(" ، ");

    const promptText = `محصولات انتخابی زیر (${targetProducts.length} کالا):
    [ ${names} ]
    را با کل وب ایران به صورت زنده آنالیز کن. کف و سقف قیمت بازار، حاشیه سود ما و بهترین قیمت پیشنهادی سودآور را در یک جدول دقیق ارائه بده.`;

    handleSend(promptText);
  };

  const handleSEOArticleGen = () => {
    setSelectorModalOpen(false);
    const targetProducts = productsList.filter((p) => selectedProductIds.includes(String(p.id)));
    const names = targetProducts.map((p: any) => p.name || p.title || p.title_fa).join(" ، ");

    const promptText = `برای محصولات انتخابی زیر:
    [ ${names} ]
    یک پکیج کامل سئو شامل Title Tag، Meta Description، کلمات کلیدی LSI، هشتگ‌های پربازدید، مقاله تخصصی با H1, H2, H3 و جدول مقایسه بساز.`;

    handleSend(promptText);
  };

  const downloadArticleTxt = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPublishModal = (text: string) => {
    if (!text) return;

    let extractedTitle = "مقاله جدید سئو";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (
        line.startsWith("#") ||
        line.toLowerCase().includes("title") ||
        line.includes("عنوان")
      ) {
        const clean = line
          .replace(/^[#*:-]+/g, "")
          .replace(/عنوان|Title Tag|Title/gi, "")
          .replace(/[*#]/g, "")
          .trim();

        if (clean.length > 3) {
          extractedTitle = clean;
          break;
        }
      }
    }

    if (extractedTitle === "مقاله جدید سئو" && lines.length > 0) {
      extractedTitle = lines[0].replace(/[*#]/g, "").substring(0, 60).trim();
    }

    setArticleToPublish({
      title: extractedTitle,
      metaDescription: "توضیحات سئو شده مقاله تولید شده توسط هوش مصنوعی",
      keywords: "سئو, خرید آنلاین, مقاله تخصصی",
      content: text,
    });
    setPublishModalOpen(true);
  };

  const handleFinalPublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleToPublish),
      });

      const data = await res.json();
      if (data && data.success) {
        soundEngine.playSuccess();
        alert("🎉 مقاله با موفقیت در بخش مقالات سایت و دیتابیس منتشر گردید!");
        setPublishModalOpen(false);
      } else {
        alert("خطا در انتشار مقاله.");
      }
    } catch {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" dir="rtl">
      {!isOpen && (
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
          }}
          className="p-4 rounded-full bg-blue-600 text-white border border-white/20 shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-bold"
        >
          <span>🚀</span>
          <span>دستیار هوشمند سئو و بازارسنجی</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[92vw] sm:w-[540px] lg:w-[720px] h-[660px] max-h-[90vh] rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl flex flex-col justify-between overflow-hidden text-[var(--text-primary)] backdrop-blur-2xl animate-fadeIn">
          <div className="p-4 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--input-bg)]">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white text-xs">📊</span>
              <div>
                <h4 className="font-extrabold text-xs text-[var(--text-primary)]">دستیار ارشد سئو و قیمت‌گذاری</h4>
                <p className="text-[9px] text-[var(--text-secondary)] font-medium">پایش زنده محصولات و تولید محتوای تخصصی</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-bold">🎯 هدف فعال:</span>
              <span className="bg-blue-500/15 text-blue-500 border border-blue-500/30 px-3 py-1 rounded-xl text-[11px] font-extrabold">
                {selectedProductIds.length === 0
                  ? "هیچ کالایی انتخاب نشده"
                  : `${selectedProductIds.length} کالا انتخاب شده`}
              </span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setSelectorModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-1"
            >
              <span>🖼️</span>
              <span>مشاهده و انتخاب کالاها</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`p-4 rounded-2xl max-w-[98%] space-y-2 ${
                    m.role === "user"
                      ? "mr-auto bg-blue-600 text-white font-medium"
                      : "ml-auto bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] shadow-inner"
                  }`}
                >
                  {m.role === "model" && idx > 0 && (
                    <div className="flex flex-wrap justify-end gap-2 border-b border-[var(--card-border)] pb-2 mb-2">
                      <button
                        onClick={() => downloadArticleTxt(m.text, `Report_${idx}`)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 hover:text-white border border-emerald-500/30 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        📥 دانلود فایل (TXT)
                      </button>
                      <button
                        onClick={() => openPublishModal(m.text)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        🚀 ویرایش و انتشار در وبلاگ
                      </button>
                    </div>
                  )}

                  <div
                    className="prose prose-xs max-w-none space-y-2 overflow-x-auto text-[var(--text-primary)]"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(m.text),
                    }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] animate-pulse flex items-center gap-2 font-bold">
                <span>🔍</span>
                <span>در حال پردازش، آنالیز و تولید ساختار مقاله...</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[var(--card-border)] flex gap-2">
            <input
              type="text"
              value={input}
              disabled={selectedProductIds.length === 0}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedProductIds.length === 0
                  ? "لطفاً ابتدا از دکمه بالا کالاها را انتخاب کنید..."
                  : "درخواست تحلیل قیمت، مقایسه یا نگارش مقاله سئو..."
              }
              className="flex-1 p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] disabled:opacity-40 font-medium"
            />
            <button
              disabled={selectedProductIds.length === 0}
              onClick={() => handleSend()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ارسال
            </button>
          </div>
        </div>
      )}

      {/* مدال انتخاب محصولات */}
      {selectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-4 sm:p-6 flex flex-col justify-between text-[var(--text-primary)] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
              <div>
                <h3 className="text-base font-black text-blue-500 flex items-center gap-2">
                  <span>💎</span> کاتالوگ محصولات جهت آنالیز هوشمند و تولید محتوا
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                  کالاهای مورد نظر را انتخاب کنید تا استراتژی قیمت یا مقاله جامع آن نگارش شود.
                </p>
              </div>
              <button
                onClick={() => setSelectorModalOpen(false)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-xl bg-[var(--input-bg)] cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <div className="py-3 space-y-2 border-b border-[var(--card-border)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-blue-500">📁 فیلتر دسته‌بندی:</span>
                <button
                  onClick={handleSelectAllSite}
                  className="px-3 py-1 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  {selectedProductIds.length === productsList.length
                    ? "✕ لغو انتخاب کل محصولات"
                    : "🌐 انتخاب تمام محصولات سایت"}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-2xl border transition cursor-pointer font-extrabold whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  همه دسته‌ها ({productsList.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl border transition cursor-pointer font-extrabold whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    📂 {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold text-[var(--text-secondary)]">
                  📦 کالاهای موجود ({categoryProducts.length} کالا)
                </span>
                <button
                  onClick={handleSelectAllCategory}
                  className="text-blue-500 hover:underline font-extrabold cursor-pointer"
                >
                  انتخاب کل محصولات این دسته
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryProducts.map((p: any) => {
                  const isSelected = selectedProductIds.includes(String(p.id));
                  const displayImg = p.images?.[0] || p.image_url || p.image || "";
                  const displayName = p.name || p.title || p.title_fa || "کالا";

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(String(p.id))}
                      className={`group rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between relative ${
                        isSelected
                          ? "bg-[var(--input-bg)] border-blue-500 text-[var(--text-primary)] shadow-2xl scale-[1.03] ring-2 ring-blue-500/50"
                          : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-blue-500 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="w-full h-36 bg-black/5 dark:bg-black/40 relative overflow-hidden flex items-center justify-center p-2">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={displayName}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] text-xs">
                            <span className="text-2xl">🖼️</span>
                            <span>بدون تصویر</span>
                          </div>
                        )}

                        <div
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full border flex items-center justify-center transition shadow-lg ${
                            isSelected
                              ? "bg-blue-600 border-white text-white font-extrabold scale-110"
                              : "border-[var(--card-border)] bg-black/20 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-blue-500 font-bold block opacity-80 mb-0.5">
                            {p.category || p.category_name || "کالای عمومی"}
                          </span>
                          <h4 className="font-extrabold text-xs leading-snug line-clamp-2 text-[var(--text-primary)]">
                            {displayName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-[var(--card-border)] flex justify-between items-center text-xs">
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium">قیمت فروش:</span>
                          <span className="font-extrabold text-blue-500 font-mono">
                            {Number(p.price || 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)] flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs font-bold text-blue-500 flex items-center gap-2">
                <span>تعداد انتخاب شده:</span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md">
                  {selectedProductIds.length} کالا
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={selectedProductIds.length === 0}
                  onClick={handleMarketAnalysis}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedProductIds.length > 0
                      ? "bg-blue-600 text-white shadow-lg cursor-pointer hover:bg-blue-700"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--card-border)]"
                  }`}
                >
                  <span>🔍</span>
                  <span>آنالیز زنده قیمت در وب ایران</span>
                </button>

                <button
                  disabled={selectedProductIds.length === 0}
                  onClick={handleSEOArticleGen}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedProductIds.length > 0
                      ? "bg-[var(--input-bg)] hover:border-blue-500 text-[var(--text-primary)] border border-[var(--card-border)] cursor-pointer"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--card-border)]"
                  }`}
                >
                  <span>✍️</span>
                  <span>ساخت پکیج و مقاله سئو</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مدال تایید و انتشار مستقیم مقاله در وبلاگ */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 text-[var(--text-primary)] shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm font-black text-blue-500">📝 بررسی و انتشار مستقیم مقاله در وبلاگ</h3>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان سئو شده (Title Tag):</label>
                <input
                  type="text"
                  value={articleToPublish.title}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, title: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-bold focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیحات متا (Meta Description):</label>
                <input
                  type="text"
                  value={articleToPublish.metaDescription}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, metaDescription: e.target.value })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-blue-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">متن کامل مقاله (قابل ویرایش):</label>
                <textarea
                  rows={10}
                  value={articleToPublish.content}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, content: e.target.value })
                  }
                  className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none font-sans leading-relaxed text-xs focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[var(--card-border)]">
              <button
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] text-xs font-bold hover:opacity-80 cursor-pointer text-[var(--text-secondary)] border border-[var(--card-border)]"
              >
                انصراف
              </button>
              <button
                disabled={publishing}
                onClick={handleFinalPublish}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md cursor-pointer"
              >
                {publishing ? "در حال انتشار..." : "🌐 تایید و انتشار در وب‌سایت"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMarkdownText(text: string) {
  if (!text) return "";
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-black text-blue-500 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-black text-[var(--text-primary)] mt-4 mb-2 border-b border-[var(--card-border)] pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-[var(--text-primary)] mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-500 font-extrabold">$1</strong>')
    .replace(/---/g, '<hr class="border-[var(--card-border)] my-3" />')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc opacity-90">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal opacity-90">$1</li>');
}