"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import OrderManager from "@/components/admin/OrderManager";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminInventoryManager from "@/components/AdminInventoryManager";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminCustomers from "@/components/admin/AdminCustomers";
import { productService, Product } from "@/services/productService";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  const [activeTab, setActiveTab] = useState<
    "products" | "inventory" | "blogs" | "coupons" | "customers" | "banners" | "menu" | "orders" | "siteInfo"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  // مدال‌ها
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdminManagerModal, setShowAdminManagerModal] = useState(false);

  // وضعیت نمایش رمز
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // استیت فرم تغییر کلمه عبور
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // استیت ساخت ادمین جدید
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("product_manager");
  const [adminCreateMsg, setAdminCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isAdminLoggedIn") || localStorage.getItem("pv_admin_session");
    const storedUser = localStorage.getItem("admin_current_user");

    if (loggedIn !== "true" && !loggedIn) {
      setIsAuthenticated(false);
      router.replace("/admin/login");
    } else {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          const parsed: AdminUser = JSON.parse(storedUser);
          setCurrentUser(parsed);
          setNewUsername(parsed.username || "");
          setNewFullName(parsed.full_name || "");

          if (parsed.role === "content_editor") {
            setActiveTab("blogs");
          } else if (parsed.role === "product_manager") {
            setActiveTab("products");
          }
        } catch {
          setCurrentUser({
            id: "master-admin",
            username: "admin",
            full_name: "مدیر ارشد پوریا ویژوالز",
            role: "super_admin",
          });
        }
      } else {
        setCurrentUser({
          id: "master-admin",
          username: "admin",
          full_name: "مدیر ارشد پوریا ویژوالز",
          role: "super_admin",
        });
      }
    }

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    async function loadInfo() {
      try {
        const info = await siteInfoService.getAll();
        setSiteInfo(info);
      } catch (e) {}
    }
    loadInfo();

    const handleSiteUpdate = (e: any) => {
      if (e.detail) setSiteInfo(e.detail);
    };
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, [router]);

  const loadAllAdmins = async () => {
    try {
      const list = await adminAuthService.getAllAdmins();
      setAdminList(Array.isArray(list) ? list : []);
    } catch (e) {
      setAdminList([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("pv_admin_session");
    localStorage.removeItem("admin_current_user");
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.replace("/admin/login");
  };

  const toggleDarkMode = () => {
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
        setPasswordMsg({ type: "success", text: "✨ مشخصات و رمز عبور با موفقیت به‌روزرسانی شد." });
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
        setAdminCreateMsg({ type: "success", text: "🎉 ادمین جدید با موفقیت ایجاد شد." });
        setNewAdminUsername("");
        setNewAdminPassword("");
        setNewAdminFullName("");
        loadAllAdmins();
      } else {
        setAdminCreateMsg({ type: "error", text: res?.message || "خطا در ایجاد کاربر." });
      }
    } catch {
      setAdminCreateMsg({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (confirm(`آیا از حذف دسترسی ادمین "${username}" اطمینان دارید؟`)) {
      await adminAuthService.deleteAdmin(adminId);
      loadAllAdmins();
    }
  };

  const isGoogleIndexAllowed = siteInfo?.allowGoogleIndex !== false;
  const userRole = currentUser?.role || "super_admin";

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case "super_admin":
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 font-black text-[10px]">👑 مدیر ارشد</span>;
      case "product_manager":
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-[10px]">📦 مدیر انبار و کالا</span>;
      case "content_editor":
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-[10px]">✍️ ویراستار مقالات</span>;
      default:
        return null;
    }
  };

  const navTabs = [
    { id: "products", label: "محصولات", icon: "📦", allowed: ["super_admin", "product_manager"] },
    { id: "inventory", label: "انبارداری", icon: "📥", allowed: ["super_admin", "product_manager"] },
    { id: "orders", label: "سفارش‌ها و پست", icon: "📑", allowed: ["super_admin"] },
    { id: "coupons", label: "تخفیف‌ها", icon: "🏷️", allowed: ["super_admin"] },
    { id: "customers", label: "باشگاه مخاطبان", icon: "👥", allowed: ["super_admin"] },
    { id: "blogs", label: "مقالات و سئو", icon: "📚", allowed: ["super_admin", "content_editor"] },
    { id: "banners", label: "بنرها و اسلایدر", icon: "🖼️", allowed: ["super_admin"] },
    { id: "menu", label: "منوها و دسته‌ها", icon: "🔗", allowed: ["super_admin"] },
    { id: "siteInfo", label: "اطلاعات سایت", icon: "⚙️", allowed: ["super_admin"] },
  ].filter((tab) => tab.allowed.includes(userRole));

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200 text-xs font-bold animate-pulse font-sans">
        در حال بررسی سطح دسترسی امنیتی...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 font-sans text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 select-none" dir="rtl">
      <AdminGlobalSearch />

      {/* هدر بالایی پنل ادمین */}
      <header className="p-4 md:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg font-black shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white">کنترل پنل پیشرفته فروشگاه</h1>
              <span
                title={isGoogleIndexAllowed ? "ایندکس گوگل فعال است" : "ایندکس گوگل غیرفعال است"}
                className={`w-2.5 h-2.5 rounded-full ${
                  isGoogleIndexAllowed ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-rose-500"
                }`}
              />
              {getRoleBadge(userRole)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              مدیر آنلاین: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.full_name || currentUser?.username}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {userRole === "super_admin" && (
            <button
              onClick={() => {
                setShowAdminManagerModal(true);
                loadAllAdmins();
              }}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>👥</span>
              <span>مدیریت ادمین‌ها</span>
            </button>
          )}

          <button
            onClick={() => {
              setPasswordMsg(null);
              setShowPasswordModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🔐</span>
            <span>تغییر رمز</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer text-xs flex items-center justify-center shadow-sm"
            title="جستجوی سریع (Ctrl+K)"
          >
            🔍
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer text-xs shadow-sm font-bold"
            title="تم شب / روز"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <a
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            🏠 مشاهده سایت
          </a>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            🚪 خروج
          </button>
        </div>
      </header>

      {/* نمایش آمار و سلامت */}
      {userRole !== "content_editor" && (
        <>
          <AdminDashboardStats />
          <AdminHealthGuard />
        </>
      )}

      {/* نوار ناوبری تب‌ها */}
      <div className="relative p-1.5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-2xl overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
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
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
        {activeTab === "products" && (userRole === "super_admin" || userRole === "product_manager") && <AdminProducts />}
        {activeTab === "inventory" && (userRole === "super_admin" || userRole === "product_manager") && <AdminInventoryManager />}
        {activeTab === "blogs" && (userRole === "super_admin" || userRole === "content_editor") && <AdminBlogManager />}
        {activeTab === "orders" && userRole === "super_admin" && <OrderManager />}
        {activeTab === "coupons" && userRole === "super_admin" && <AdminCoupons />}
        {activeTab === "customers" && userRole === "super_admin" && <AdminCustomers />}
        {activeTab === "banners" && userRole === "super_admin" && <AdminBanners />}
        {activeTab === "menu" && userRole === "super_admin" && <AdminMenu />}
        {activeTab === "siteInfo" && userRole === "super_admin" && <AdminSiteInfo />}
      </div>

      {userRole === "super_admin" && <AdminAIAssistant />}

      {/* مدال تغییر کلمه عبور */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 space-y-5 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                  🔐
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">تغییر مشخصات و کلمه عبور</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">امنیت دسترسی حساب مدیریت</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                }`}
              >
                <span>{passwordMsg.type === "success" ? "✓" : "⚠️"}</span>
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">نام نمایشی:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثلاً: پوریا"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold focus:border-blue-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">نام کاربری لاگین:</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono font-bold focus:border-blue-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">کلمه عبور جدید:</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono focus:border-blue-500 transition text-xs pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer p-1"
                  >
                    {showNewPass ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">تکرار کلمه عبور جدید:</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز جدید..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono focus:border-blue-500 transition text-xs pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer p-1"
                  >
                    {showConfirmPass ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:opacity-80 font-bold cursor-pointer text-slate-600 dark:text-slate-400 transition text-xs border border-slate-200 dark:border-slate-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 space-y-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 text-lg">
                  👥
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">سامانه مدیریت ادمین‌ها و سطوح دسترسی</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">تفکیک وظایف نویسنده مقالات و مدیر انبار</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminManagerModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold hover:border-blue-500 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 block">➕ ساخت ادمین جدید:</span>

              {adminCreateMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    adminCreateMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <span>{adminCreateMsg.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{adminCreateMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: علی رضایی"
                    value={newAdminFullName}
                    onChange={(e) => setNewAdminFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">سطح دسترسی (Role):</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold focus:border-blue-500 cursor-pointer"
                  >
                    <option value="product_manager">📦 مدیر کالا (فقط محصولات و کاتالوگ)</option>
                    <option value="content_editor">✍️ نویسنده (فقط مقالات سئو)</option>
                    <option value="super_admin">👑 مدیر ارشد (دسترسی کامل)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">نام کاربری جهت ورود:</label>
                  <input
                    type="text"
                    required
                    placeholder="username..."
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono font-bold focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-bold text-slate-600 dark:text-slate-400">کلمه عبور ورود:</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono focus:border-blue-500 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer p-1"
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
              <span className="font-bold text-xs text-slate-600 dark:text-slate-400 block">لیست مدیران فعال:</span>
              <div className="space-y-2">
                {adminList.map((adm) => (
                  <div
                    key={adm.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white font-black">{adm.full_name}</strong>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">({adm.username})</span>
                      </div>
                      <div>{getRoleBadge(adm.role)}</div>
                    </div>

                    {adm.username !== currentUser?.username && (
                      <button
                        onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
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

// 📝 کامپوننت ویراستار مقالات سئو متصل به API و پایگاه‌داده
function AdminBlogManager() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        setBlogs(json.data);
        localStorage.setItem("site_blogs", JSON.stringify(json.data));
        return;
      }
    } catch (e) {}

    try {
      const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      setBlogs(Array.isArray(localBlogs) ? localBlogs : []);
    } catch (e) {
      setBlogs([]);
    }
  };

  const handleCreateNewArticle = () => {
    const newArticle = {
      id: `blog-${Date.now()}`,
      title: "",
      content: "<p>متن خود را اینجا بنویسید...</p>",
      createdAt: new Date().toLocaleDateString("fa-IR"),
      isVisible: true,
    };
    setEditingBlog(newArticle);
  };

  useEffect(() => {
    if (editingBlog && editorRef.current) {
      const timer = setTimeout(() => {
        const currentHtml = editorRef.current?.innerHTML || "";
        const updatedBlog = { ...editingBlog, content: currentHtml };

        try {
          const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
          const idx = localBlogs.findIndex((b: any) => b.id === editingBlog.id);
          let updatedList;
          if (idx >= 0) {
            updatedList = localBlogs.map((b: any) => (b.id === editingBlog.id ? updatedBlog : b));
          } else {
            updatedList = [updatedBlog, ...localBlogs];
          }
          localStorage.setItem("site_blogs", JSON.stringify(updatedList));
          setBlogs(updatedList);
          setAutoSaveStatus("⚡ پیش‌نویس خودکار ذخیره شد");
          setTimeout(() => setAutoSaveStatus(""), 2000);
        } catch (e) {}
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [editingBlog]);

  const toggleVisibility = (id: string) => {
    const updated = blogs.map((b) =>
      b.id === id ? { ...b, isVisible: b.isVisible === false ? true : false } : b
    );
    localStorage.setItem("site_blogs", JSON.stringify(updated));
    setBlogs(updated);
  };

  const deleteBlog = (id: string) => {
    if (confirm("آیا از حذف این مقاله اطمینان دارید؟")) {
      const updated = blogs.filter((b) => b.id !== id);
      localStorage.setItem("site_blogs", JSON.stringify(updated));
      setBlogs(updated);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #334155;">
        <thead>
          <tr style="background:#1e293b;">
            <th style="padding:8px; color:#f8fafc;">عنوان ۱</th>
            <th style="padding:8px; color:#f8fafc;">عنوان ۲</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px; color:#cbd5e1;">محتوا ۱</td>
            <td style="padding:8px; color:#cbd5e1;">محتوا ۲</td>
          </tr>
        </tbody>
      </table>
    `;
    exec("insertHTML", tableHtml);
  };

  const insertLink = () => {
    const url = prompt("لینک مورد نظر را وارد کنید:");
    if (url) exec("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("آدرس اینترنتی تصویر را وارد کنید:");
    if (url) exec("insertImage", url);
  };

  const handleSaveBlogEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    const currentHtml = editorRef.current?.innerHTML || editingBlog.content;
    const finalBlog = { ...editingBlog, content: currentHtml };

    try {
      await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBlog),
      });
    } catch (e) {}

    try {
      const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
      const idx = localBlogs.findIndex((b: any) => b.id === finalBlog.id);
      let updated;
      if (idx >= 0) {
        updated = localBlogs.map((b: any) => (b.id === finalBlog.id ? finalBlog : b));
      } else {
        updated = [finalBlog, ...localBlogs];
      }

      localStorage.setItem("site_blogs", JSON.stringify(updated));
      setBlogs(updated);
    } catch (e) {}

    setEditingBlog(null);
    alert("🎉 مقاله با موفقیت ذخیره و منتشر شد!");
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans select-none">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black text-blue-600 dark:text-blue-400">📚 مدیریت و نگارش مقالات سئو</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">ویرایشگر متنی با امکانات فرمت‌بندی، جداول و ذخیره خودکار</p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold">
            {blogs.length} مقاله موجود
          </span>

          <button
            onClick={handleCreateNewArticle}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>➕</span>
            <span>نگارش مقاله جدید</span>
          </button>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400 space-y-2 font-bold">
          <p>هنوز مقاله‌ای ثبت نشده است. با دکمه «نگارش مقاله جدید» اولین مقاله را بسازید.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 hover:border-blue-500 transition"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>📅 {blog.createdAt || "امروز"}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      blog.isVisible !== false ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {blog.isVisible !== false ? "نمایش در سایت" : "مخفی شده"}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">{blog.title || "مقاله بدون عنوان"}</h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setEditingBlog({ ...blog })}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                >
                  ✏️ ویرایش
                </button>

                <button
                  onClick={() => toggleVisibility(blog.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                    blog.isVisible !== false
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                  }`}
                >
                  {blog.isVisible !== false ? "👁️ مخفی‌سازی" : "✅ نمایش"}
                </button>

                <button
                  onClick={() => deleteBlog(blog.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال ویرایش مقاله */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSaveBlogEdit} className="max-w-5xl w-full max-h-[94vh] overflow-y-auto p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-blue-600 dark:text-blue-400">✏️ ویرایشگر سند و نگارش مقاله سئو</h3>
                {autoSaveStatus && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">{autoSaveStatus}</span>}
              </div>
              <button type="button" onClick={() => setEditingBlog(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                ✕ بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-600 dark:text-slate-400">عنوان اصلی مقاله (Title):</label>
                <input
                  type="text"
                  required
                  placeholder="عنوان جذاب سئو شده بنویسید..."
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-400">نوار ابزار کامل ویرایش:</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs select-none items-center">
                  <select onChange={(e) => exec("fontName", e.target.value)} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer">
                    <option value="vazir">فونت: وزیرمتن</option>
                    <option value="yekan">فونت: ایران‌یکان</option>
                    <option value="shabnam">فونت: شبنم</option>
                    <option value="tahoma">فونت: Tahoma</option>
                  </select>

                  <select onChange={(e) => exec("fontSize", e.target.value)} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer">
                    <option value="3">سایز معمولی</option>
                    <option value="1">خیلی کوچک</option>
                    <option value="2">کوچک</option>
                    <option value="4">متوسط</option>
                    <option value="5">بزرگ</option>
                    <option value="6">خیلی بزرگ</option>
                    <option value="7">تیتر بزرگ (H1)</option>
                  </select>

                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 my-auto" />

                  <button type="button" onClick={() => exec("bold")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg font-black" title="Bold"><b>B</b></button>
                  <button type="button" onClick={() => exec("italic")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg italic" title="Italic"><i>I</i></button>
                  <button type="button" onClick={() => exec("underline")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg underline" title="Underline"><u>U</u></button>

                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 my-auto" />

                  <button type="button" onClick={() => exec("justifyRight")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg" title="راست‌چین">👉</button>
                  <button type="button" onClick={() => exec("justifyCenter")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg" title="وسط‌چین">↔️</button>
                  <button type="button" onClick={() => exec("justifyLeft")} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg" title="چپ‌چین">👈</button>
                  <button type="button" onClick={() => exec("justifyFull")} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold" title="Justify">≡ جاستیفای</button>

                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 my-auto" />

                  <button type="button" onClick={insertTable} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg font-bold">📊 جدول</button>
                  <button type="button" onClick={insertLink} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg font-bold">🔗 لینک</button>
                  <button type="button" onClick={insertImage} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 hover:opacity-80 rounded-lg font-bold">🖼️ عکس</button>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-600 dark:text-slate-400">متن مقاله:</label>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: editingBlog.content || "" }}
                  className="w-full min-h-[350px] max-h-[500px] overflow-y-auto p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none leading-relaxed text-xs focus:border-blue-500 font-sans shadow-inner text-slate-900 dark:text-white"
                  style={{ textAlign: "justify" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md cursor-pointer"
              >
                ذخیره و انتشار مقاله 💾
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// 🤖 دستیار هوشمند سئو و بازارسنجی
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
      text: "سلام مدیر گرامی! 👋\nبرای آغاز، روی دکمه «🎯 انتخاب محصولات برای آنالیز/سئو» کلیک کنید تا کارت‌های هوشمند محصولات را همراه با تصویر و قیمت مشاهده کنید.",
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
      if (typeof window !== "undefined") {
        try {
          const prods = (await productService.getAll()) || [];
          const validProds = Array.isArray(prods) ? prods : [];
          setProductsList(validProds);

          const cats = Array.from(
            new Set(validProds.map((p: any) => p.category_id || p.category || "عمومی"))
          ).filter(Boolean) as string[];
          setCategories(cats);
        } catch (e) {}
      }
    }
    initAssistant();
  }, [isOpen, selectorModalOpen]);

  const categoryProducts = selectedCategory === "all"
    ? productsList
    : productsList.filter((p) => (p.category || "عمومی") === selectedCategory);

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
      if (data && data.response) {
        setMessages((prev) => [...prev, { role: "model", text: data.response }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "متأسفانه در حال حاضر امکان پردازش درخواست وجود ندارد." },
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
    یک پکیج کامل سئو شامل Title Tag، Meta Description، کلمات کلیدی LSI، هشتگ‌های پربازدید، مقاله تخصصی با H1, H2, H3 و لینک‌دهی مستقیم بساز.`;

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
        const existingBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        const newPostItem = data.post || {
          id: Date.now().toString(),
          ...articleToPublish,
          createdAt: new Date().toLocaleDateString("fa-IR"),
          isVisible: true,
        };
        const updatedBlogs = [newPostItem, ...existingBlogs];
        localStorage.setItem("site_blogs", JSON.stringify(updatedBlogs));

        alert("🎉 مقاله با موفقیت در بخش مقالات سایت منتشر شد!");
        setPublishModalOpen(false);
      } else {
        alert("خطا در انتشار مقاله.");
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" dir="rtl">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-blue-600 text-white border border-white/20 shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-bold"
        >
          <span>🚀</span>
          <span>مدیر هوشمند سئو و بازارسنجی</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-[540px] lg:w-[720px] h-[660px] rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-800 dark:text-slate-100 backdrop-blur-2xl">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white text-xs">📊</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">مدیر ارشد رشد، سئو و بازارسنجی</h4>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">پایش زنده وب ایران و استراتژی قیمت‌گذاری</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">🎯 هدف فعال:</span>
              <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-3 py-1 rounded-xl text-[11px] font-extrabold">
                {selectedProductIds.length === 0
                  ? "هیچ محصولی انتخاب نشده"
                  : `${selectedProductIds.length} محصول انتخاب شده`}
              </span>
            </div>
            <button
              onClick={() => setSelectorModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-1"
            >
              <span>🖼️</span>
              <span>مشاهده کارت‌های محصولات</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`p-4 rounded-2xl max-w-[98%] space-y-2 ${
                    m.role === "user"
                      ? "mr-auto bg-blue-600 text-white font-medium"
                      : "ml-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-inner"
                  }`}
                >
                  {m.role === "model" && idx > 0 && (
                    <div className="flex flex-wrap justify-end gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                      <button
                        onClick={() => downloadArticleTxt(m.text, `Report_${idx}`)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        📥 دانلود فایل متنی (TXT)
                      </button>
                      <button
                        onClick={() => openPublishModal(m.text)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        🚀 ویرایش و انتشار مستقیم در بلاگ
                      </button>
                    </div>
                  )}

                  <div
                    className="prose prose-xs max-w-none space-y-2 overflow-x-auto text-slate-800 dark:text-slate-100"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(m.text),
                    }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] animate-pulse flex items-center gap-2 font-bold">
                <span>🔍</span>
                <span>در حال آنالیز محصولات، محاسبه حاشیه سود و ساختار سئو...</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={input}
              disabled={selectedProductIds.length === 0}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedProductIds.length === 0
                  ? "لطفاً ابتدا از دکمه بالا محصول انتخاب کنید..."
                  : "درخواست آنالیز، قیمت‌گذاری یا سئو..."
              }
              className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-40 font-medium"
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

      {selectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between text-slate-800 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span>💎</span> کارت‌های ویترینی محصولات
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  مشخصات کالا را بررسی کرده و جهت آنالیز/سئو انتخاب نمایید.
                </p>
              </div>
              <button
                onClick={() => setSelectorModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <div className="py-3 space-y-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">📁 ۱. انتخاب دسته‌بندی:</span>
                <button
                  onClick={handleSelectAllSite}
                  className="px-3 py-1 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  {selectedProductIds.length === productsList.length
                    ? "✕ لغو انتخاب کل محصولات"
                    : "🌐 انتخاب تمامی محصولات کل سایت"}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-2xl border transition cursor-pointer font-extrabold whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
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
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    📂 {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  📦 ۲. محصولات ({categoryProducts.length} کالا در این دسته)
                </span>
                <button
                  onClick={handleSelectAllCategory}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold cursor-pointer"
                >
                  انتخاب همه محصولات این دسته
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
                          ? "bg-slate-100 dark:bg-slate-800 border-blue-500 text-slate-900 dark:text-white shadow-2xl scale-[1.03] ring-2 ring-blue-500/50"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:scale-[1.01]"
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
                          <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                            <span className="text-2xl">🖼️</span>
                            <span>بدون تصویر</span>
                          </div>
                        )}

                        <div
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full border flex items-center justify-center transition shadow-lg ${
                            isSelected
                              ? "bg-blue-600 border-white text-white font-extrabold scale-110"
                              : "border-slate-300 dark:border-slate-600 bg-black/20 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block opacity-80 mb-0.5">
                            {p.category || "کالای عمومی"}
                          </span>
                          <h4 className="font-extrabold text-xs leading-snug line-clamp-2 text-slate-900 dark:text-white">
                            {displayName}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">قیمت فروش:</span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {Number(p.price || 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
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
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>🔍</span>
                  <span>پایش زنده قیمت در وب ایران</span>
                </button>

                <button
                  disabled={selectedProductIds.length === 0}
                  onClick={handleSEOArticleGen}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedProductIds.length > 0
                      ? "bg-slate-100 dark:bg-slate-800 hover:border-blue-500 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>✍️</span>
                  <span>ساخت مقاله و پکیج سئو</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-800 dark:text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-blue-600 dark:text-blue-400">📝 بررسی و انتشار مستقیم مقاله در سایت</h3>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-600 dark:text-slate-400">عنوان مقاله (Title Tag):</label>
                <input
                  type="text"
                  value={articleToPublish.title}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, title: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-600 dark:text-slate-400">توضیحات متا (Meta Description):</label>
                <input
                  type="text"
                  value={articleToPublish.metaDescription}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, metaDescription: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-600 dark:text-slate-400">متن کامل مقاله (قابل ویرایش):</label>
                <textarea
                  rows={10}
                  value={articleToPublish.content}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, content: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-sans leading-relaxed text-xs focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:opacity-80 cursor-pointer text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                انصراف
              </button>
              <button
                disabled={publishing}
                onClick={handleFinalPublish}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md cursor-pointer"
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

  let formatted = text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-black text-blue-500 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-black text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-500 font-extrabold">$1</strong>')
    .replace(/---/g, '<hr class="border-slate-200 dark:border-slate-700 my-3" />')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc opacity-90">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal opacity-90">$1</li>');

  if (formatted.includes("|")) {
    const lines = formatted.split("\n");
    let inTable = false;
    let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full text-[11px] text-right border-collapse rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">';

    lines.forEach((line) => {
      if (line.trim().startsWith("|")) {
        if (!inTable) inTable = true;
        if (line.includes("---")) return;

        const cells = line.split("|").filter((cell, index, arr) => index > 0 && index < arr.length - 1);
        const isHeader = !tableHtml.includes("<tbody>");

        if (isHeader) {
          tableHtml += '<thead class="bg-black/5 dark:bg-white/5 text-blue-500"><tr>';
          cells.forEach((c) => (tableHtml += `<th class="p-2.5 border-b border-slate-200 dark:border-slate-700 font-bold">${c.trim()}</th>`));
          tableHtml += "</tr></thead><tbody>";
        } else {
          tableHtml += '<tr class="border-b border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition">';
          cells.forEach((c) => (tableHtml += `<td class="p-2.5 text-slate-800 dark:text-slate-200 font-medium">${c.trim()}</td>`));
          tableHtml += "</tr>";
        }
      } else if (inTable) {
        inTable = false;
        tableHtml += "</tbody></table></div>";
      }
    });

    if (inTable) tableHtml += "</tbody></table></div>";
    formatted = tableHtml + formatted.replace(/\|.*\|/g, "");
  }

  return formatted;
}