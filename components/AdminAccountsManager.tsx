"use client";

import React, { useState, useEffect } from "react";
import { adminAuthService, AdminUser, AdminRole } from "@/services/adminAuthService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminAccountsManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("product_manager");

  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await adminAuthService.getAllAdmins();
      setAdmins(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await adminAuthService.createAdmin({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim() || username.trim(),
        role,
      });

      if (res.success) {
        soundEngine.playSuccess();
        showToast(`کاربر مدیر «${username}» با موفقیت ایجاد گردید.`);
        setUsername("");
        setPassword("");
        setFullName("");
        setRole("product_manager");
        await loadAdmins();
      } else {
        showToast(res.message || "خطا در ایجاد حساب کاربری مدیر.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (adm: AdminUser) => {
    soundEngine.playClick();
    setEditingAdmin(adm);
    setEditUsername(adm.username);
    setEditFullName(adm.full_name || "");
    setNewPassword("");
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    soundEngine.playClick();
    setSubmitting(true);
    try {
      const res = await adminAuthService.updateCredentials(
        editingAdmin.id,
        editUsername,
        newPassword.trim() || undefined,
        editFullName.trim() || undefined
      );

      if (res.success) {
        soundEngine.playSuccess();
        showToast("اطلاعات حساب مدیر با موفقیت به‌روزرسانی شد.");
        setEditingAdmin(null);
        await loadAdmins();
      } else {
        showToast(res.message || "خطا در ویرایش مشخصات.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, admUser: string) => {
    if (confirm(`آیا از حذف دسترسی ادمین "${admUser}" اطمینان دارید؟`)) {
      soundEngine.playClick();
      await adminAuthService.deleteAdmin(id);
      showToast("حساب کاربری مدیر حذف شد.");
      await loadAdmins();
    }
  };

  const getRoleBadge = (r: AdminRole) => {
    switch (r) {
      case "super_admin":
      case "superadmin":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">مدیر کل سیستم</span>;
      case "product_manager":
      case "inventory_manager":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[10px]">مدیر انبار و محصولات</span>;
      case "content_editor":
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px]">نویسنده و سئو</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 shadow-lg animate-fadeIn">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* هدر بخش مدیریت ادمین‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🛡️</span> مدیریت دسترسی‌ها و حساب‌های مدیران
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف نقش‌های دسترسی، ایجاد حساب کاربری برای همکاران و تغییر کلمه عبور
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-black text-xs">
          {admins.length} مدیر ثبت‌شده
        </span>
      </div>

      {/* فرم ایجاد حساب مدیر جدید */}
      <form onSubmit={handleCreateAdmin} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">➕ ثبت مدیر جدید</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">نقش و سطح دسترسی *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)] cursor-pointer"
            >
              <option value="product_manager">مدیر انبار و محصولات</option>
              <option value="content_editor">نویسنده محتوا و سئو</option>
              <option value="super_admin">مدیر کل سیستم</option>
            </select>
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

      {/* جدول نمایش لیست مدیران */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری لیست مدیران...</div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">مدیری ثبت نشده است.</div>
        ) : (
          <table className="w-full text-right text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--text-secondary)] font-black">
                <th className="pb-3 px-2">نام مدیر</th>
                <th className="pb-3 px-2">نام کاربری</th>
                <th className="pb-3 px-2">نقش دسترسی</th>
                <th className="pb-3 px-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="py-3 px-2 font-bold">{adm.full_name || "بدون نام"}</td>
                  <td className="py-3 px-2 font-mono font-bold text-[var(--accent-blue)]">{adm.username}</td>
                  <td className="py-3 px-2">{getRoleBadge(adm.role)}</td>
                  <td className="py-3 px-2 text-center flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleStartEdit(adm)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                    >
                      ✏️ ویرایش / تغییر رمز
                    </button>
                    {adm.role !== "super_admin" && adm.role !== "superadmin" && (
                      <button
                        onClick={() => handleDelete(adm.id, adm.username)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* مودال ویرایش مدیر */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleUpdateAdmin} className="max-w-md w-full rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 space-y-4 shadow-2xl text-[var(--text-primary)] text-xs">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h4 className="font-black text-sm text-[var(--accent-blue)]">✏️ ویرایش مشخصات ادمین</h4>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="w-7 h-7 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی:</label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری:</label>
              <input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">کلمه عبور جدید (در صورت نیاز):</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="در صورت خالی بودن تغییر نمی‌کند"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 rounded-xl bg-[var(--input-bg)] font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? "در حال ثبت..." : "ذخیره تغییرات 💾"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}