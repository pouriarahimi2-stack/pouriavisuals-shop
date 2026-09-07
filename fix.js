/**
 * AXON CORE - Full Category CRUD (Add, Edit, Safe Delete) & DB Sync (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ به‌روزرسانی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-DEPLOY]\x1b[0m استقرار قابلیت کامل ویرایش و حذف امن دسته‌بندی‌ها در دیتابیس...");

// =============================================================================
// ۱. ارتقای services/categoryService.ts (افزودن متد update و delete امن)
// =============================================================================
const fullCategoryService = `import { supabase } from "@/lib/supabase";

export interface Category {
  id: string;
  name: string;
  slug?: string;
  order?: number;
  created_at?: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) return [];
      return data.map((c: any) => ({
        ...c,
        id: String(c.id),
      }));
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug?: string }): Promise<Category | null> {
    try {
      const cleanName = cat.name.trim();
      const cleanSlug = (cat.slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\\u0600-\\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload: Record<string, any> = {
        name: cleanName,
        slug: cleanSlug,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { ...data, id: String(data.id) };
    } catch (e) {
      console.error("Add category error:", e);
      return null;
    }
  },

  async updateCategory(id: string, newName: string): Promise<Category | null> {
    try {
      const cleanName = newName.trim();
      const cleanSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9\\u0600-\\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // واکشی نام قبلی جهت به‌روزرسانی محصولات متصل
      const { data: oldCat } = await supabase
        .from("categories")
        .select("name")
        .eq("id", id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("categories")
        .update({
          name: cleanName,
          slug: cleanSlug,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // همگام‌سازی نام دسته در جدول محصولات
      if (oldCat?.name) {
        await supabase
          .from("products")
          .update({ category: cleanName })
          .eq("category", oldCat.name);
      }

      return { ...data, id: String(data.id) };
    } catch (e) {
      console.error("Update category error:", e);
      return null;
    }
  },

  async deleteCategory(id: string, catName?: string): Promise<boolean> {
    try {
      // تغییر دسته محصولات وابسته به پیش‌فرض جهت حفظ سلامت داده‌ها
      if (catName) {
        await supabase
          .from("products")
          .update({ category: "تجهیزات عمومی" })
          .eq("category", catName);
      }

      const { error } = await supabase.from("categories").delete().eq("id", id);
      return !error;
    } catch (e) {
      console.error("Delete category error:", e);
      return false;
    }
  },
};
`;
writeFile('services/categoryService.ts', fullCategoryService);

// =============================================================================
// ۲. به‌روزرسانی components/AdminMenu.tsx با قابلیت ویرایش نام (Edit) و حذف (Delete)
// =============================================================================
const adminMenuContent = `"use client";

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

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

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
      setStatusMessage({ type: "success", text: "⚡ ساختار منو در دیتابیس ذخیره و فعال گردید." });
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
    });

    if (res) {
      soundEngine.playSuccess();
      setNewCatName("");
      loadAll();
      setStatusMessage({ type: "success", text: "دسته‌بندی «" + res.name + "» با موفقیت افزوده شد." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleStartEdit = (cat: Category) => {
    soundEngine.playClick();
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCatId || !editingCatName.trim()) return;
    soundEngine.playClick();
    const updated = await categoryService.updateCategory(editingCatId, editingCatName.trim());
    if (updated) {
      soundEngine.playSuccess();
      setEditingCatId(null);
      setEditingCatName("");
      loadAll();
      setStatusMessage({ type: "success", text: "دسته‌بندی با موفقیت ویرایش و محصولات همگام شدند." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm("آیا از حذف دسته‌بندی «" + name + "» از پایگاه داده اطمینان دارید؟")) {
      soundEngine.playClick();
      const ok = await categoryService.deleteCategory(id, name);
      if (ok) {
        soundEngine.playSuccess();
        loadAll();
        setStatusMessage({ type: "success", text: "دسته‌بندی با موفقیت حذف گردید." });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🔗</span> مدیریت پیوندها، منوی هدر و دسته‌بندی‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ویرایش کامل، ایجاد و حذف دسته‌بندی‌های محصولات در دیتابیس به همراه منوهای ناوبری
          </p>
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
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30")}>
          {statusMessage.text}
        </div>
      )}

      {/* بخش دسته‌بندی‌ها با فول CRUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAddCategory} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + ثبت دسته‌بندی جدید در دیتابیس
          </h3>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)]">نام دسته‌بندی *</label>
            <input
              type="text"
              placeholder="مثلاً: تجهیزات پردازش هوش مصنوعی"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs transition cursor-pointer shadow-md hover:opacity-90"
          >
            + ایجاد دسته‌بندی در دیتابیس
          </button>
        </form>

        <div className="lg:col-span-2 bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            📂 دسته‌بندی‌های ثبت‌شده در پایگاه داده ({categories.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
            {categories.map((c) => {
              const isEditing = editingCatId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 shadow-sm"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--accent-blue)] text-xs font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px]"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 text-white font-bold text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{c.name}</h4>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">/{c.slug || c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(c)}
                          className="p-1.5 px-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] text-[11px] font-bold transition cursor-pointer"
                          title="ویرایش نام دسته‌بندی"
                        >
                          ✏️ ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition cursor-pointer font-bold text-[11px]"
                          title="حذف دسته‌بندی از دیتابیس"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* بخش لینک‌های منوی هدر */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--card-border)]">
        <form onSubmit={handleAddItem} className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-sm h-fit text-xs">
          <h3 className="text-xs font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
            + افزودن پیوند جدید به منوی بالای سایت
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
              placeholder="/products"
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

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {items.map((item, idx) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
writeFile('components/AdminMenu.tsx', adminMenuContent);

// =============================================================================
// ۳. تست بیلد محلی و پوش مستقیم به گیت‌هاب
// =============================================================================
console.log("تست بیلد کامل نرم‌افزار (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت کامل پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(categories): full CRUD support with safe update, rename and cascade product sync"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمامی قابلیت‌های ویرایش، حذف و ذخیره‌سازی امن دسته‌بندی‌ها روی سرور مستقر گردید.\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}