"use client";

import React, { useState, useEffect } from "react";
import { menuService, MenuItem } from "@/services/menuService";
import { categoryService, Category } from "@/services/categoryService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCatName, setNewCatName] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAll = async () => {
    const [menus, cats] = await Promise.all([
      menuService.getAll(),
      categoryService.getAll(),
    ]);
    setItems(menus || []);
    setCategories(cats || []);
  };

  useEffect(() => {
    loadAll();

    const handleMenuUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setItems(e.detail);
      else loadAll();
    };
    const handleCategoriesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setCategories(e.detail);
      else loadAll();
    };

    window.addEventListener("menu_updated", handleMenuUpdate);
    window.addEventListener("categories_updated", handleCategoriesUpdate);

    return () => {
      window.removeEventListener("menu_updated", handleMenuUpdate);
      window.removeEventListener("categories_updated", handleCategoriesUpdate);
    };
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    soundEngine.playClick();
    const newItem: MenuItem = {
      id: "menu_" + Date.now(),
      title: newTitle.trim(),
      url: newUrl.trim(),
      order: items.length + 1,
      isActive: true,
      is_active: true,
    };

    setItems([...items, newItem]);
    setNewTitle("");
    setNewUrl("");
  };

  const handleRemoveItem = (index: number) => {
    soundEngine.playClick();
    setItems(items.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    soundEngine.playClick();
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const list = [...items];
    const [temp] = list.splice(index, 1);
    list.splice(target, 0, temp);
    setItems(list);
  };

  const handleSaveAll = async () => {
    soundEngine.playClick();
    setSaving(true);
    const ok = await menuService.saveAll(items);
    setSaving(false);

    if (ok) {
      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "⚡ ساختار منو در دیتابیس ذخیره و در هدر سایت فعال گردید." });
      loadAll();
    } else {
      setStatusMessage({ type: "error", text: "خطا در ذخیره‌سازی منوها در دیتابیس." });
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    soundEngine.playClick();
    const res = await categoryService.addCategory({
      name: newCatName.trim(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, "-"),
    });

    if (res) {
      soundEngine.playSuccess();
      setNewCatName("");
      loadAll();
      setStatusMessage({ type: "success", text: `دسته‌بندی «${res.name}» با موفقیت افزوده شد.` });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`آیا از حذف دسته‌بندی "${name}" اطمینان دارید؟`)) {
      soundEngine.playClick();
      await categoryService.deleteCategory(id);
      loadAll();
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🔗</span> مدیریت پیوندها، منوی هدر و دسته‌بندی‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">افزودن و ترتیب پیوندهای ناوبری بالای سایت به همراه مدیریت دسته‌های محصولات</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-md cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری منو"}
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold transition animate-fadeIn ${statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAddItem} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + افزودن آیتم جدید به منوی هدر
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">عنوان لینک *</label>
            <input
              type="text"
              placeholder="مثلاً: کاتالوگ مانیتورها"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">آدرس مقصد (URL) *</label>
            <input
              type="text"
              placeholder="/products یا /#products"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--accent-blue)] hover:text-white border border-[var(--card-border)] font-bold text-xs transition cursor-pointer"
          >
            + اضافه کردن به لیست منو
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📋 چینش و ترتیب آیتم‌های منو ({items.length})
          </h3>

          <div className="space-y-2 max-h-[460px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-center py-8 text-[var(--text-secondary)] font-bold">هیچ آیتمی در منو وجود ندارد.</p>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-black text-xs text-[var(--text-secondary)]">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.title}</h4>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)]">{item.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* بخش دسته‌بندی‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--card-border)]">
        <form onSubmit={handleAddCategory} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + ثبت دسته‌بندی جدید فروشگاه
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">نام دسته‌بندی *</label>
            <input
              type="text"
              placeholder="مثلاً: تجهیزات نورپردازی"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-md"
          >
            + ایجاد دسته‌بندی
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📂 دسته‌بندی‌های فعال سایت ({categories.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
            {categories.map((c) => (
              <div
                key={c.id || c.name}
                className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 shadow-sm"
              >
                <div>
                  <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{c.name}</h4>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">/{c.slug}</span>
                </div>
                {c.id && (
                  <button
                    onClick={() => handleDeleteCategory(c.id!, c.name)}
                    className="p-1.5 px-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer font-bold text-xs"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}