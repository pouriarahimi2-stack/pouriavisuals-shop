// File Path: components/AdminMenu.tsx
"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";

export interface NavMenuItem {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_active: boolean;
}

const DEFAULT_NAV_ITEMS: NavMenuItem[] = [
  { id: "nav_1", title: "کاتالوگ محصولات", url: "/products", is_active: true },
  { id: "nav_2", title: "اخبار تکنولوژی", url: "/news", is_active: true },
  { id: "nav_3", title: "مجله سئو", url: "/blog", is_active: true },
  { id: "nav_4", title: "پیگیری سفارش", url: "/track-order", is_active: true },
  { id: "nav_5", title: "تماس با ما", url: "/contact", is_active: true },
];

export function AdminMenu() {
  const [activeTab, setActiveTab] = useState<"menus" | "categories">("menus");
  const [navItems, setNavItems] = useState<NavMenuItem[]>(DEFAULT_NAV_ITEMS);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // فرم افزودن آیتم منوی جدید
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("/products");

  // فرم افزودن / ویرایش دسته‌بندی
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("💻");
  const [catDesc, setCatDesc] = useState("");

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchMenusAndCategories = async () => {
    try {
      const [siteRes, catsRes] = await Promise.all([
        fetch("/api/site-info", { cache: "no-store" }).catch(() => null),
        fetch("/api/categories", { cache: "no-store" }).catch(() => null),
      ]);

      if (siteRes && siteRes.ok) {
        const sJson = await siteRes.json();
        const info = sJson.data || sJson.siteInfo || sJson;
        if (info && Array.isArray(info.navigation_menu) && info.navigation_menu.length > 0) {
          setNavItems(info.navigation_menu);
        }
      }

      if (catsRes && catsRes.ok) {
        const cJson = await catsRes.json();
        const list = cJson.categories || cJson.data || [];
        setCategories(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error("Error loading menus and categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenusAndCategories();

    const chCats = supabase
      .channel("realtime-admin-menu-categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        fetchMenusAndCategories();
      })
      .subscribe();

    const chSite = supabase
      .channel("realtime-admin-menu-siteinfo")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        fetchMenusAndCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chCats);
      supabase.removeChannel(chSite);
    };
  }, []);

  const syncHeaderNavigationEverywhere = async (updatedMenus: NavMenuItem[]) => {
    setSaving(true);
    try {
      await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navigation_menu: updatedMenus }),
      }).catch(() => null);

      if (typeof window !== "undefined") {
        try {
          const rawGlobal = localStorage.getItem(GLOBAL_NAV_KEY);
          const parsed = rawGlobal ? JSON.parse(rawGlobal) : {};
          const currentHeader = parsed.header || {
            type: "HeaderCapsuleBar",
            props: { id: "global-header-core", brandText: "Axon | آکسون" },
          };
          const activeList = updatedMenus.filter((m) => m.is_active !== false);
          currentHeader.props = {
            ...currentHeader.props,
            menu1Text: activeList[0]?.title || "کاتالوگ محصولات",
            menu1Url: activeList[0]?.url || "/products",
            menu2Text: activeList[1]?.title || "اخبار تکنولوژی",
            menu2Url: activeList[1]?.url || "/news",
            menu3Text: activeList[2]?.title || "مجله سئو",
            menu3Url: activeList[2]?.url || "/blog",
            menu4Text: activeList[3]?.title || "پیگیری سفارش",
            menu4Url: activeList[3]?.url || "/track-order",
            menu5Text: activeList[4]?.title || "تماس با ما",
            menu5Url: activeList[4]?.url || "/contact",
          };
          localStorage.setItem(
            GLOBAL_NAV_KEY,
            JSON.stringify({ ...parsed, header: currentHeader })
          );
          window.dispatchEvent(new CustomEvent("menus_updated", { detail: updatedMenus }));
          window.dispatchEvent(new CustomEvent("site_info_updated"));
        } catch {}
      }

      soundEngine.playSuccess();
      notify("✓ ساختار منوهای ناوبری هدر و موبایل به صورت بلادرنگ در کل سایت ذخیره شد.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuTitle.trim() || !newMenuUrl.trim()) return;
    soundEngine.playClick();
    const nextList: NavMenuItem[] = [
      ...navItems,
      {
        id: "nav_" + Date.now(),
        title: newMenuTitle.trim(),
        url: newMenuUrl.trim(),
        is_active: true,
      },
    ];
    setNavItems(nextList);
    setNewMenuTitle("");
    setNewMenuUrl("/products");
    syncHeaderNavigationEverywhere(nextList);
  };

  const handleMoveMenu = (index: number, dir: "up" | "down") => {
    soundEngine.playClick();
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= navItems.length) return;
    const copy = [...navItems];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setNavItems(copy);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    soundEngine.playClick();
    setSaving(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCatId || undefined,
          name: catName.trim(),
          slug: catSlug.trim() || catName.trim(),
          icon: catIcon.trim() || "💻",
          description: catDesc.trim(),
          is_active: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message || "✓ دسته‌بندی با موفقیت در دیتابیس ثبت شد.");
        setEditingCatId(null);
        setCatName("");
        setCatSlug("");
        setCatDesc("");
        fetchMenusAndCategories();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/categories?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("دسته‌‌بندی با موفقیت حذف شد.");
        fetchMenusAndCategories();
      } else {
        alert(json.message || "خطا در حذف دسته‌بندی.");
      }
    } catch {}
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      {/* نوار ناوبری یکپارچه استودیوی طراحی */}
      <div className="p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/appearance"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            🎨 استودیوی ظاهر و سکشن‌ها
          </Link>
          <Link
            href="/admin/pages"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            ⚡ صفحه‌ساز ماژولار
          </Link>
          <span className="px-3.5 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black shadow">
            🧭 منو و دسته‌بندی‌ها
          </span>
          <Link
            href="/admin/styles"
            className="px-3.5 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold transition"
          >
            ✨ هویت بصری، فونت و CSS
          </Link>
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🧭</span> مدیریت یکپارچه منوهای ناوبری و دسته‌بندی‌های کاتالوگ
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            متصل به هدر دسکتاپ، منوی موبایل، تبلت و صفحه‌ساز ماژولار از طریق وب‌سوکت بلادرنگ
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("menus");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "menus"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🔗 منوهای ناوبری سایت ({navItems.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("categories");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer " +
              (activeTab === "categories"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📁 دسته‌بندی‌های محصولات ({categories.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-fadeIn">
          {feedback}
        </div>
      )}

      {activeTab === "menus" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <form
            onSubmit={handleAddMenuItem}
            className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit"
          >
            <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              ➕ افزودن لینک جدید به منوی سایت
            </h3>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان منو *</label>
              <input
                type="text"
                required
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="مثال: جشنواره تخفیف‌ها"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">انتخاب سریع مقصد یا آدرس لینک *</label>
              <select
                onChange={(e) => {
                  if (e.target.value) setNewMenuUrl(e.target.value);
                }}
                className="w-full p-2.5 mb-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
              >
                <option value="/products">🛍️ کاتالوگ محصولات (/products)</option>
                <option value="/news">📡 اخبار تکنولوژی (/news)</option>
                <option value="/blog">📚 مجله تخصصی (/blog)</option>
                <option value="/track-order">📦 پیگیری سفارش (/track-order)</option>
                <option value="/contact">📞 تماس با ما (/contact)</option>
                <option value="/about">ℹ️ درباره ما (/about)</option>
              </select>
              <input
                type="text"
                required
                dir="ltr"
                value={newMenuUrl}
                onChange={(e) => setNewMenuUrl(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer"
            >
              افزودن به منوی سایت +
            </button>
          </form>

          <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm">چیدمان و ویرایش منوهای فعال هدر و موبایل</h3>
              <button
                type="button"
                disabled={saving}
                onClick={() => syncHeaderNavigationEverywhere(navItems)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow"
              >
                {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار منوها در هدر سایت"}
              </button>
            </div>

            <div className="space-y-2.5">
              {navItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const copy = [...navItems];
                        copy[idx] = { ...copy[idx], title: e.target.value };
                        setNavItems(copy);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={item.url}
                      onChange={(e) => {
                        const copy = [...navItems];
                        copy[idx] = { ...copy[idx], url: e.target.value };
                        setNavItems(copy);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveMenu(idx, "up")}
                      disabled={idx === 0}
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveMenu(idx, "down")}
                      disabled={idx === navItems.length - 1}
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = navItems.filter((n) => n.id !== item.id);
                        setNavItems(filtered);
                        syncHeaderNavigationEverywhere(filtered);
                      }}
                      className="p-2 px-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit"
          >
            <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
              {editingCatId ? "✏️ ویرایش دسته‌بندی" : "➕ ایجاد دسته‌بندی محصول جدید"}
            </h3>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام دسته‌بندی *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="مثال: لپ‌تاپ و اولترابوک"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">نامک (Slug)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="laptops"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">آیکون</label>
                <input
                  type="text"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">توضیح کوتاه دسته‌بندی</label>
              <textarea
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer"
            >
              {editingCatId ? "💾 بروزرسانی دسته‌بندی" : "💾 ثبت دسته‌بندی در دیتابیس"}
            </button>
          </form>

          <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <h3 className="font-black text-sm border-b border-[var(--card-border)] pb-3">
              دسته‌بندی‌های فعال کاتالوگ ({categories.length})
            </h3>

            {loading ? (
              <div className="py-12 text-center text-slate-400">در حال بارگذاری...</div>
            ) : categories.length === 0 ? (
              <div className="py-12 text-center text-slate-400">هنوز دسته‌بندی ثبت نشده است.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-2xl">{cat.icon || "📁"}</span>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-xs truncate">{cat.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          /{cat.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setEditingCatId(cat.id);
                          setCatName(cat.name);
                          setCatSlug(cat.slug || "");
                          setCatIcon(cat.icon || "💻");
                          setCatDesc(cat.description || "");
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold cursor-pointer"
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
      )}
    </div>
  );
}

export default AdminMenu;
