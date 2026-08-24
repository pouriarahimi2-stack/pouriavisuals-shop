"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
}

const LOCAL_STORAGE_KEY = "site_menu_items";

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // فرم ایجاد / ویرایش منو
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadMenu = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: MenuItem[] = data.map((d: any) => ({
            id: String(d.id),
            title: d.title,
            url: d.url,
            order: Number(d.order ?? 0),
            isActive: d.is_active ?? d.isActive ?? true,
          }));

          setMenuItems(mapped);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
          return;
        }
      }

      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        setMenuItems(JSON.parse(local));
      } else {
        const defaults: MenuItem[] = [
          { id: "m_1", title: "صفحه نخست", url: "/", order: 1, isActive: true },
          { id: "m_2", title: "کاتالوگ محصولات", url: "/#products", order: 2, isActive: true },
          { id: "m_3", title: "پیگیری مرسوله پستی", url: "/track-order", order: 3, isActive: true },
          { id: "m_4", title: "مجله و مقالات سئو", url: "/blog", order: 4, isActive: true },
          { id: "m_5", title: "تماس با پشتیبانی", url: "/contact", order: 5, isActive: true },
        ];
        setMenuItems(defaults);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error("Error loading menu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    if (editingId) {
      const updated = menuItems.map((item) =>
        item.id === editingId ? { ...item, title: title.trim(), url: url.trim() } : item
      );
      setMenuItems(updated);
      setEditingId(null);
      showToast("آیتم منو ویرایش شد.");
    } else {
      const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        title: title.trim(),
        url: url.trim(),
        order: menuItems.length + 1,
        isActive: true,
      };
      setMenuItems([...menuItems, newItem]);
      showToast("آیتم جدید به لیست منوها افزوده شد.");
    }

    setTitle("");
    setUrl("");
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
  };

  const handleToggleActive = (id: string) => {
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setMenuItems(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این پیوند از منو اطمینان دارید؟")) {
      const updated = menuItems.filter((item) => item.id !== id);
      setMenuItems(updated);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const updated = [...menuItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setMenuItems(reordered);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(menuItems));

      if (supabase) {
        const payload = menuItems.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          order: item.order,
          is_active: item.isActive,
        }));

        await supabase.from("menu_items").delete().neq("id", "0");
        await supabase.from("menu_items").insert(payload);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("menu_updated", { detail: menuItems }));
      }

      showToast("✨ تغییرات منو در دیتابیس ثبت و در سایت اعمال شد.");
    } catch (e) {
      console.error("Error saving menu:", e);
      showToast("خطا در ذخیره‌سازی منو.");
    } finally {
      setSaving(false);
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

      {/* هدر بخش منوها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base flex items-center gap-2 text-[var(--accent-blue)]">
            <span>🔗</span> مدیریت پیوندها و منوی ناوبری سایت
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            تنظیم عناوین پیوندهای سربرگ، لینک‌های هدایت‌کننده و ترتیب نمایش
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>💾</span>
          <span>{saving ? "در حال ذخیره‌سازی..." : "انتشار و ذخیره منو"}</span>
        </button>
      </div>

      {/* فرم افزودن/ویرایش پیوند منو */}
      <form onSubmit={handleFormSubmit} className="p-6 md:p-8 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
        <h4 className="font-black text-xs text-[var(--text-primary)]">
          {editingId ? "✏️ ویرایش پیوند منو" : "➕ افزودن پیوند جدید به منو"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">عنوان منو *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جشنواره نوروزی"
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">آدرس پیوند مقصد (URL) *</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="مثال: /#products یا https://..."
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none font-mono font-bold text-[var(--text-primary)] focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setUrl("");
              }}
              className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] font-bold cursor-pointer text-[var(--text-secondary)]"
            >
              انصراف
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black hover:opacity-90 transition cursor-pointer shadow-md"
          >
            {editingId ? "ثبت ویرایش منو ✏️" : "+ درج در منو"}
          </button>
        </div>
      </form>

      {/* لیست پیوندهای منو */}
      <div className="p-6 rounded-[2.5rem] bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h4 className="font-black text-xs text-[var(--text-secondary)]">پیوندهای فعال سربرگ ({menuItems.length})</h4>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">در حال بارگذاری منوها...</div>
        ) : menuItems.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-[var(--text-secondary)]">هیچ پیوندی در منو تعریف نشده است.</div>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-black text-xs text-[var(--text-secondary)]">
                    {index + 1}
                  </span>
                  <div>
                    <h5 className="font-black text-xs text-[var(--text-primary)]">{item.title}</h5>
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] block mt-0.5">{item.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-xl p-1">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      className="px-2 py-1 hover:text-[var(--accent-blue)] disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === menuItems.length - 1}
                      onClick={() => handleMove(index, "down")}
                      className="px-2 py-1 hover:text-[var(--accent-blue)] disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleActive(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                      item.isActive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gray-500/15 text-gray-500 border border-gray-500/30"
                    }`}
                  >
                    {item.isActive ? "فعال" : "مخفی"}
                  </button>

                  <button
                    onClick={() => handleStartEdit(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold transition cursor-pointer text-[11px]"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}