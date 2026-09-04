"use client";

import React, { useState, useEffect } from "react";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { siteInfoService, DEFAULT_AUTH_SECURITY_CONFIG, AuthSecurityConfig } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";
import { realtimeEngine } from "@/lib/realtimeSync";

export default function AdminAccountsManager() {
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "auth_studio">("admins");

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
        setSecurityConfig(info.auth_security_config);
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
        setRole("product_manager");
      } else {
        showToast(res.message || "خطا در ایجاد مدیر.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (newPassword.trim()) {
      if (!currentPassword.trim()) {
        showToast("کلمه عبور فعلی خود را وارد نمایید.", "error");
        return;
      }
      if (newPassword.trim().length < 4) {
        showToast("رمز جدید باید حداقل ۴ کاراکتر باشد.", "error");
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        showToast("رمز عبور جدید با تکرار آن مطابقت ندارد!", "error");
        return;
      }
    }

    soundEngine.playClick();
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdmin.id,
          username: editUsername.trim(),
          currentPassword: currentPassword.trim() || undefined,
          password: newPassword.trim() || undefined,
          full_name: editFullName.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        showToast("✅ اطلاعات و رمز عبور مدیر با موفقیت ذخیره شد.", "success");
        const updatedList = admins.map((a) =>
          a.id === editingAdmin.id
            ? { ...a, username: editUsername.trim(), full_name: editFullName.trim() }
            : a
        );
        setAdmins(updatedList);
        localStorage.setItem("axon_admin_active_session_v2026", JSON.stringify(json.data));
        realtimeEngine.broadcastLocally("admin_users_updated", updatedList);
        setEditingAdmin(null);
      } else {
        showToast(json.message || "خطا در ثبت اطلاعات.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        showToast("⚡ تمامی تنظیمات پین امنیتی، طول اسلات‌ها و دک‌های ورود با موفقیت در دیتابیس ثبت و فعال شدند.", "success");
      }
    } catch {
      showToast("خطا در ذخیره دیتابیس.", "error");
    } finally {
      setSavingDeck(false);
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
          onClick={() => { soundEngine.playClick(); setActiveSubTab("admins"); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === "admins"
              ? "bg-[var(--accent-blue)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          👥 مدیریت حساب‌ها و مدیران
        </button>

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
      </div>

      {activeSubTab === "admins" ? (
        <>
          <form onSubmit={handleCreateAdmin} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
            <h4 className="font-black text-xs text-[var(--text-primary)]">➕ ثبت مدیر جدید</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی احمدی"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نام کاربری لاتین *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_ali"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نقش و سطح دسترسی *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
                >
                  <option value="product_manager">مدیر انبار و محصولات</option>
                  <option value="content_editor">نویسنده محتوا و سئو</option>
                  <option value="super_admin">مدیر کل سیستم (Superadmin)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">کلمه عبور امنیتی *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور امنیتی *</label>
                <input
                  type="password"
                  required
                  value={confirmNewUserPassword}
                  onChange={(e) => setConfirmNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "+ ایجاد حساب مدیر"}
              </button>
            </div>
          </form>

          <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                  <th className="pb-3 px-2">نام مدیر</th>
                  <th className="pb-3 px-2">نام کاربری</th>
                  <th className="pb-3 px-2">نقش دسترسی</th>
                  <th className="pb-3 px-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-2 font-bold text-[var(--text-primary)]">{adm.full_name || "بدون نام"}</td>
                    <td className="py-3 px-2 font-mono font-bold text-[var(--accent-blue)]">{adm.username}</td>
                    <td className="py-3 px-2">{adm.role}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setEditingAdmin(adm);
                          setEditUsername(adm.username);
                          setEditFullName(adm.full_name || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold transition cursor-pointer"
                      >
                        ✏️ ویرایش مشخصات و رمز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* استودیوی کنترل دک‌های ورود و پین‌های امنیتی */
        <form onSubmit={handleSaveSecurityStudio} className="space-y-6">
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] pb-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg font-black">
                ⚡
              </span>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  ۱. مدیریت دک ورود ادمین (/admin/login - Component 100)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">تغییر پین ورود، تعداد ارقام اسلات‌ها (۴، ۶ یا ۸ رقم) و متون</p>
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
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value={4}>۴ رقمی (استاندارد ویدیو)</option>
                  <option value={6}>۶ رقمی (امنیت بالا)</option>
                  <option value={8}>۸ رقمی (حداکثر امنیت)</option>
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
                <p className="text-[11px] text-[var(--text-secondary)]">تنظیم تعداد ارقام OTP پیامکی (۴، ۶ یا ۸ رقم)، کد تستی سریع و عنوان‌ها</p>
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
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value={4}>۴ رقم (مطابق ویدیو)</option>
                  <option value={6}>۶ رقم (استاندارد بانکی)</option>
                  <option value={8}>۸ رقم</option>
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
              <span>{savingDeck ? "در حال ثبت در دیتابیس..." : "ذخیره و فعال‌سازی سراسری دک‌های امنیتی"}</span>
            </button>
          </div>
        </form>
      )}

      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
          <form onSubmit={handleUpdateAdmin} className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 sm:p-8 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h4 className="font-black text-sm text-[var(--accent-blue)]">ویرایش مشخصات مدیر</h4>
              <button type="button" onClick={() => setEditingAdmin(null)} className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold">✕</button>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری:</label>
              <input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور فعلی:</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="رمز فعلی جهت تایید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور جدید (اختیاری):</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="کلمه عبور جدید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">تکرار کلمه عبور جدید:</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تکرار رمز جدید" className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono" />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
              <button type="button" onClick={() => setEditingAdmin(null)} className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)]">انصراف</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md">ذخیره 💾</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
