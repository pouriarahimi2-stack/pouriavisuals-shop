// File Path: app/admin/roles/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface AdminUserItem {
  id: string;
  username: string;
  full_name: string;
  role: string;
  permissions: string[];
  created_at?: string;
}

const ALL_PERMISSIONS = [
  { id: "dashboard", label: "📊 داشبورد و آمار زنده" },
  { id: "orders", label: "📦 مدیریت سفارشات و بارنامه" },
  { id: "products", label: "🛍️ کاتالوگ محصولات و قیمت‌ها" },
  { id: "inventory", label: "🏭 انبارداری و موجودی" },
  { id: "financial", label: "💳 امور مالی و حسابداری" },
  { id: "customers", label: "👥 مشتریان (CRM) و پیامک" },
  { id: "coupons", label: "🏷️ کدهای تخفیف و کمپین‌ها" },
  { id: "appearance", label: "🎨 استودیوی ظاهر، هدر و فوتر" },
  { id: "pages", label: "⚡ صفحه‌ساز ماژولار" },
  { id: "menu", label: "🧭 منوها و دسته‌بندی‌ها" },
  { id: "banners", label: "🖼️ مدیریت بنرها و اسلایدر" },
  { id: "blog", label: "📚 مجله و مقالات سئو" },
  { id: "news", label: "📡 رادار اخبار تکنولوژی" },
  { id: "seo", label: "🚀 مرکز فرماندهی سئو" },
  { id: "ai", label: "🤖 سوئیت هوش مصنوعی و کوپایلوت" },
  { id: "messages", label: "📩 تیکت‌ها و پیام‌های کاربران" },
  { id: "reviews", label: "⭐ دیدگاه‌ها و نظرات" },
  { id: "settings", label: "⚙️ تنظیمات کلان و حالت تعمیرات" },
  { id: "backup", label: "💾 بکاپ و بازگردانی دیتابیس" },
  { id: "audit_logs", label: "🛡️ لاگ‌های امنیتی" },
];

export default function AdminRolesPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("product_manager");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    "dashboard",
    "products",
    "inventory",
    "orders",
  ]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.users)) {
        setUsers(json.users);
      }
    } catch (e) {
      console.error("Failed to fetch admins:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();

    const channel = supabase
      .channel("realtime-admin-roles-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_users" }, () => {
        fetchAdmins();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const applyPresetByRole = (newRole: string) => {
    setRole(newRole);
    if (newRole === "superadmin") {
      setSelectedPerms(ALL_PERMISSIONS.map((p) => p.id));
    } else if (newRole === "product_manager") {
      setSelectedPerms(["dashboard", "products", "inventory", "menu", "banners", "reviews"]);
    } else if (newRole === "order_manager") {
      setSelectedPerms(["dashboard", "orders", "customers", "financial", "coupons", "messages"]);
    } else if (newRole === "content_seo_manager") {
      setSelectedPerms(["dashboard", "blog", "news", "seo", "ai", "pages", "appearance"]);
    }
  };

  const togglePermission = (permId: string) => {
    soundEngine.playClick();
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setUsername("");
    setFullName("");
    setPassword("");
    setRole("product_manager");
    setSelectedPerms(["dashboard", "products", "inventory", "orders"]);
  };

  const handleSelectEdit = (u: AdminUserItem) => {
    soundEngine.playClick();
    setEditingId(u.id);
    setUsername(u.username);
    setFullName(u.full_name || u.username);
    setPassword("");
    setRole(u.role || "product_manager");
    if (u.role === "superadmin" || (u.permissions && u.permissions.includes("all"))) {
      setSelectedPerms(ALL_PERMISSIONS.map((p) => p.id));
    } else {
      setSelectedPerms(Array.isArray(u.permissions) ? u.permissions : ["dashboard", "products"]);
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          username: username.trim(),
          full_name: fullName.trim() || username.trim(),
          password: password.trim() || undefined,
          role,
          permissions: selectedPerms,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setFeedback({
          type: "success",
          text: json.message || "✓ حساب مدیر و ماتریس دسترسی‌های تیک‌دار با موفقیت ذخیره شد.",
        });
        resetForm();
        fetchAdmins();
      } else {
        setFeedback({ type: "error", text: json.message || json.error || "خطا در ثبت مدیر." });
      }
    } catch {
      setFeedback({ type: "error", text: "خطا در ارتباط با سرور." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm("آیا از حذف مدیر «" + name + "» اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/admin/users?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        fetchAdmins();
      } else {
        alert(json.message || "خطا در حذف مدیر.");
      }
    } catch {}
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🛡️</span> مدیریت مدیران، نقش‌ها و ماتریس تیک‌دار سطح دسترسی (Granular RBAC)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تعریف و ویرایش مدیران سیستم با انتخاب دقیق و تیک‌دار ماژول‌های مجاز برای هر مدیر
          </p>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold cursor-pointer"
          >
            + ایجاد مدیر جدید
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        <form
          onSubmit={handleSaveAdmin}
          className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4"
        >
          <h2 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            {editingId ? "✏️ ویرایش مدیر و دسترسی‌های تیک‌دار" : "➕ تعریف مدیر جدید با دسترسی سفارشی"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری (لاتین) *</label>
              <input
                type="text"
                required
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_sales"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام و نام خانوادگی مدیر *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: کارشناس فروش"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                {editingId ? "رمز عبور جدید (در صورت تمایل به تغییر):" : "کلمه عبور امنیتی *"}
              </label>
              <input
                type="password"
                required={!editingId}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نقش سازمانی پایه:</label>
              <select
                value={role}
                onChange={(e) => applyPresetByRole(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="superadmin">👑 مدیر ارشد کل سیستم (Super Admin)</option>
                <option value="product_manager">📦 مدیر کاتالوگ و انبار (Product Manager)</option>
                <option value="order_manager">💳 مدیر سفارشات و مالی (Order & Finance)</option>
                <option value="content_seo_manager">🚀 مدیر سئو و محتوا (SEO & Content)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[var(--card-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-[var(--accent-blue)]">
                ☑️ انتخاب تیک‌دار و جزئی بخش‌های مجاز برای این مدیر ({selectedPerms.length} از {ALL_PERMISSIONS.length}):
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPerms(ALL_PERMISSIONS.map((p) => p.id))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[10px] cursor-pointer"
                >
                  انتخاب همه ✓
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPerms(["dashboard"])}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 font-bold text-[10px] cursor-pointer"
                >
                  پاک کردن همه
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = selectedPerms.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={
                      "p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2.5 select-none " +
                      (isChecked
                        ? "bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] font-black text-[var(--text-primary)]"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)]")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded accent-[var(--accent-blue)] w-4 h-4 pointer-events-none"
                    />
                    <span className="truncate text-[11px]">{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs shadow-xl hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {saving
              ? "در حال ذخیره در دیتابیس..."
              : editingId
              ? "💾 ذخیره تغییرات مدیر و دسترسی‌ها"
              : "💾 ثبت مدیر جدید با دسترسی‌های انتخاب‌شده"}
          </button>
        </form>

        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit">
          <h2 className="font-black text-sm border-b border-[var(--card-border)] pb-3">
            لیست مدیران ثبت‌شده در سیستم ({users.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400">در حال بارگذاری لیست مدیران...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-400">هیچ مدیری یافت نشد.</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm">{u.full_name || u.username}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-[var(--accent-blue)]">@{u.username}</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-bold">
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectEdit(u)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                      >
                        ✏️ ویرایش دسترسی‌ها
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(u.id, u.username)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(u.permissions || []).map((pId) => {
                      const found = ALL_PERMISSIONS.find((x) => x.id === pId);
                      return (
                        <span
                          key={pId}
                          className="px-2 py-0.5 rounded-md bg-[var(--modal-bg)] border border-[var(--card-border)] text-[10px] text-slate-300"
                        >
                          {pId === "all" ? "👑 دسترسی کامل به کل سایت" : found ? found.label : pId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
