"use client";

import React, { useState, useEffect } from "react";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { realtimeEngine } from "@/lib/realtimeSync";

export default function AdminAccountsManager() {
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "auth_studio">("auth_studio");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("product_manager");

  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [securityConfig, setSecurityConfig] = useState<AuthSecurityConfig>(DEFAULT_AUTH_SECURITY_CONFIG);
  const [savingDeck, setSavingDeck] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, info] = await Promise.all([
        adminAuthService.getAllAdmins(),
        siteInfoService.getSiteInfo(),
      ]);
      setAdmins(adminList || []);
      if (info?.auth_security_config) {
        setSecurityConfig({
          adminDeck: { ...DEFAULT_AUTH_SECURITY_CONFIG.adminDeck, ...(info.auth_security_config.adminDeck || {}) },
          userDeck: { ...DEFAULT_AUTH_SECURITY_CONFIG.userDeck, ...(info.auth_security_config.userDeck || {}) },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAdminsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setAdmins(e.detail);
      else loadData();
    };
    const handleSiteUpdate = (e: any) => {
      if (e.detail?.auth_security_config) {
        setSecurityConfig(e.detail.auth_security_config);
      }
    };

    window.addEventListener("admin_users_updated", handleAdminsUpdate);
    window.addEventListener("site_info_updated", handleSiteUpdate);

    return () => {
      window.removeEventListener("admin_users_updated", handleAdminsUpdate);
      window.removeEventListener("site_info_updated", handleSiteUpdate);
    };
  }, []);

  const handleSaveSecurityStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingDeck(true);

    try {
      const updated = await siteInfoService.updateSiteInfo({
        auth_security_config: securityConfig,
      });

      if (updated) {
        soundEngine.playSuccess();
        showToast("⚡ تنظیمات پین امنیتی (۴، ۶ یا ۸ رقم) با موفقیت ۱۰۰٪ در دیتابیس ذخیره شد.", "success");
      }
    } catch {
      showToast("خطا در ثبت اطلاعات در دیتابیس.", "error");
    } finally {
      setSavingDeck(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (password.trim() !== confirmNewUserPassword.trim()) {
      showToast("کلمه عبور با تکرار آن مطابقت ندارد!", "error");
      return;
    }

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await adminAuthService.createAdmin({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim() || username.trim(),
        role,
      });

      if (res.success && res.data) {
        soundEngine.playSuccess();
        showToast(`کاربر مدیر «${username}» با موفقیت ایجاد گردید.`, "success");
        const updatedList = [...admins, res.data];
        setAdmins(updatedList);
        realtimeEngine.broadcastLocally("admin_users_updated", updatedList);
        setUsername("");
        setPassword("");
        setConfirmNewUserPassword("");
        setFullName("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {toast && (
        <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn ${
          toast.type === "success"
            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400"
        }`}>
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ناوبری زیرمجموعه */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit">
        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setActiveSubTab("auth_studio"); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "auth_studio"
              ? "bg-[var(--accent-blue)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <span>🔐</span>
          <span>استودیوی دک‌های ورود و پین امنیتی (Component 100)</span>
        </button>

        <button
          type="button"
          onClick={() => { soundEngine.playClick(); setActiveSubTab("admins"); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === "admins"
              ? "bg-[var(--accent-blue)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          👥 مدیریت حساب‌ها و مدیران
        </button>
      </div>

      {activeSubTab === "auth_studio" ? (
        <form onSubmit={handleSaveSecurityStudio} className="space-y-6">
          {/* ۱. تنظیمات دک ورود ادمین (/admin/login) */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg font-black">
                ⚡
              </span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  ۱. مدیریت دک ورود ادمین (/admin/login - Component 100)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">تغییر پین ورود و تعداد ارقام اسلات‌ها (۴، ۶ یا ۸ رقم)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">پین امنیتی ورود ادمین (PIN):</label>
                <input
                  type="text"
                  required
                  value={securityConfig.adminDeck.pin}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, pin: e.target.value.trim() },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black text-center text-sm text-[var(--accent-blue)]"
                />
              </div>

              {/* حل قطعی ناخوانایی فونت Select در تم دارک با استایل‌های صریح */}
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد ارقام اسلات‌ها (Slot Count):</label>
                <select
                  value={securityConfig.adminDeck.pinLength}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, pinLength: Number(e.target.value) as any },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none font-bold cursor-pointer"
                >
                  <option value={4} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۴ رقمی (استاندارد ویدیو)</option>
                  <option value={6} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۶ رقمی (امنیت بالا)</option>
                  <option value={8} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۸ رقمی (حداکثر امنیت)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">بج بالای کارت:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.badgeText}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, badgeText: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان اصلی کارت:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.title}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, title: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">زیرعنوان توضیحات:</label>
                <input
                  type="text"
                  value={securityConfig.adminDeck.subtitle}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      adminDeck: { ...securityConfig.adminDeck, subtitle: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          {/* ۲. تنظیمات دک ورود کاربران و خریداران (/login) */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-lg font-black">
                👤
              </span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  ۲. مدیریت دک ورود کاربران و خریداران (/login)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">تنظیم تعداد ارقام OTP پیامکی (۴، ۶ یا ۸ رقم)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تعداد ارقام کد تایید OTP:</label>
                <select
                  value={securityConfig.userDeck.otpLength}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, otpLength: Number(e.target.value) as any },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none font-bold cursor-pointer"
                >
                  <option value={4} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۴ رقم (مطابق ویدیو)</option>
                  <option value={6} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۶ رقم (استاندارد بانکی)</option>
                  <option value={8} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 py-2">۸ رقم</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کد تستی سریع کاربر (Bypass Code):</label>
                <input
                  type="text"
                  required
                  value={securityConfig.userDeck.testOtpCode}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, testOtpCode: e.target.value.trim() },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-black text-center text-sm text-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان کارت کاربر:</label>
                <input
                  type="text"
                  value={securityConfig.userDeck.title}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      userDeck: { ...securityConfig.userDeck, title: e.target.value },
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingDeck}
              className="px-8 py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              <span>💾</span>
              <span>{savingDeck ? "در حال ذخیره در دیتابیس..." : "ذخیره و فعال‌سازی سراسری دک‌های امنیتی"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* بخش مدیریت ادمین‌ها */
        <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری جدید"
              className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="کلمه عبور"
              className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold"
            />
            <button
              type="submit"
              disabled={submitting}
              className="py-3 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs"
            >
              + ثبت مدیر
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
