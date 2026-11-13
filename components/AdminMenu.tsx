// File Path: components/AdminMenu.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

const GLOBAL_NAV_KEY = "axon_global_header_footer_v2026";

export interface NavMenuItem {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  children?: NavMenuItem[];
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_active: boolean;
}

const SMART_TREE_TEMPLATES: Array<{
  label: string;
  tree: NavMenuItem;
}> = [
  {
    label: "🏠 تجهیزات خانه ⬅ آشپزخانه هوشمند ⬅ همزن برقی هوشمند",
    tree: {
      id: "tpl_home_" + Date.now(),
      title: "تجهیزات خانه",
      url: "/products?category=تجهیزات خانه",
      is_active: true,
      children: [
        {
          id: "tpl_kitchen_1",
          title: "تجهیزات هوشمند آشپزخانه",
          url: "/products?category=تجهیزات هوشمند آشپزخانه",
          is_active: true,
          children: [
            {
              id: "tpl_mixer_1",
              title: "همزن برقی هوشمند",
              url: "/products?search=همزن برقی هوشمند",
              is_active: true,
            },
            {
              id: "tpl_espresso_1",
              title: "اسپرسوساز و قهوه‌ساز هوشمند",
              url: "/products?search=اسپرسوساز",
              is_active: true,
            },
          ],
        },
      ],
    },
  },
  {
    label: "💻 کالای دیجیتال ⬅ لپ‌تاپ و نمایشگر ⬅ مانیتورهای 5K و 4K",
    tree: {
      id: "tpl_digital_" + Date.now(),
      title: "کالای دیجیتال و سخت‌افزار",
      url: "/products?category=کالای دیجیتال",
      is_active: true,
      children: [
        {
          id: "tpl_display_1",
          title: "نمایشگر و مانیتورهای تخصصی",
          url: "/products?category=مانیتور",
          is_active: true,
          children: [
            {
              id: "tpl_mon_5k",
              title: "مانیتورهای 5K و رتینا",
              url: "/products?search=5K",
              is_active: true,
            },
            {
              id: "tpl_mon_4k",
              title: "مانیتورهای 4K اولترا اچ‌دی",
              url: "/products?search=4K",
              is_active: true,
            },
          ],
        },
      ],
    },
  },
  {
    label: "🔌 جانبی و اتصال ⬅ کابل و هاب پرسرعت ⬅ تاندربولت ۵ و USB4",
    tree: {
      id: "tpl_acc_" + Date.now(),
      title: "لوازم جانبی و اتصالات",
      url: "/products?category=لوازم جانبی",
      is_active: true,
      children: [
        {
          id: "tpl_hub_1",
          title: "کابل، داک و هاب پرسرعت",
          url: "/products?category=کابل و مبدل",
          is_active: true,
          children: [
            {
              id: "tpl_tb5",
              title: "کابل و تجهیزات تاندربولت ۵",
              url: "/products?search=Thunderbolt",
              is_active: true,
            },
            {
              id: "tpl_magsafe",
              title: "شارژر و هولدر مگ‌سیف",
              url: "/products?search=مگ سیف",
              is_active: true,
            },
          ],
        },
      ],
    },
  },
];

const DEFAULT_NAV_ITEMS: NavMenuItem[] = [
  {
    id: "nav_1",
    title: "کاتالوگ محصولات",
    url: "/products",
    is_active: true,
    children: [],
  },
  { id: "nav_2", title: "اخبار تکنولوژی", url: "/news", is_active: true, children: [] },
  { id: "nav_3", title: "مجله سئو", url: "/blog", is_active: true, children: [] },
  { id: "nav_4", title: "پیگیری سفارش", url: "/track-order", is_active: true, children: [] },
  { id: "nav_5", title: "تماس با ما", url: "/contact", is_active: true, children: [] },
];

export function AdminMenu() {
  const [activeTab, setActiveTab] = useState<"menus" | "categories">("menus");
  const [navItems, setNavItems] = useState<NavMenuItem[]>(DEFAULT_NAV_ITEMS);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("/products");

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingOriginalName, setEditingOriginalName] = useState<string>("");
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("💻");
  const [catDesc, setCatDesc] = useState("");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchMenusAndCategories = useCallback(async () => {
    try {
      const [siteRes, catsRes] = await Promise.all([
        fetch("/api/site-info?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/categories?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (siteRes && siteRes.ok) {
        const sJson = await siteRes.json();
        const info = sJson.data || sJson.siteInfo || sJson;
        const menuList =
          Array.isArray(info?.navigation_menu) && info.navigation_menu.length > 0
            ? info.navigation_menu
            : Array.isArray(info?.homepage_layout_config?.navigation_menu) &&
              info.homepage_layout_config.navigation_menu.length > 0
            ? info.homepage_layout_config.navigation_menu
            : null;
        if (menuList) {
          setNavItems(menuList);
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
  }, []);

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
  }, [fetchMenusAndCategories]);

  const syncHeaderNavigationEverywhere = async (updatedMenus: NavMenuItem[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navigation_menu: updatedMenus }),
      });

      if (typeof window !== "undefined") {
        try {
          const rawGlobal = localStorage.getItem(GLOBAL_NAV_KEY);
          const parsed = rawGlobal ? JSON.parse(rawGlobal) : {};
          const currentHeader = parsed.header || {
            type: "HeaderCapsuleBar",
            props: { id: "global-header-core", brandText: "آکسون کور | Axon Core" },
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
          localStorage.removeItem("axon_site_info_cache_permanent_v2026");
          window.dispatchEvent(new CustomEvent("menus_updated", { detail: updatedMenus }));
          window.dispatchEvent(new CustomEvent("site_info_updated"));
        } catch {}
      }

      if (res.ok) {
        soundEngine.playSuccess();
        notify("✓ درخت منو و زیرمنوهای ۳ سطحی به صورت بلادرنگ در کل سایت ذخیره شد.");
      } else {
        notify("خطا در ذخیره درخت منو.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuTitle.trim()) return;
    soundEngine.playClick();
    const nextList: NavMenuItem[] = [
      ...navItems,
      {
        id: "nav_" + Date.now(),
        title: newMenuTitle.trim(),
        url: newMenuUrl.trim() || "/products",
        is_active: true,
        children: [],
      },
    ];
    setNavItems(nextList);
    setNewMenuTitle("");
    syncHeaderNavigationEverywhere(nextList);
  };

  const handleMoveMenuItem = (index: number, dir: "up" | "down") => {
    soundEngine.playClick();
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= navItems.length) return;
    const copy = [...navItems];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setNavItems(copy);
  };

  const handleInjectSmartTemplate = (tplTree: NavMenuItem) => {
    soundEngine.playSuccess();
    const cloned: NavMenuItem = JSON.parse(JSON.stringify(tplTree));
    cloned.id = "smart_" + Date.now();
    const nextList = [...navItems, cloned];
    setNavItems(nextList);
    syncHeaderNavigationEverywhere(nextList);
  };

  const addSubMenuLevel2 = (parentIdx: number) => {
    soundEngine.playClick();
    const copy = [...navItems];
    const parent = copy[parentIdx];
    const children = Array.isArray(parent.children) ? [...parent.children] : [];
    children.push({
      id: "sub2_" + Date.now(),
      title: "زیرمنوی جدید " + parent.title,
      url: "/products?category=" + encodeURIComponent(parent.title),
      is_active: true,
      children: [],
    });
    copy[parentIdx] = { ...parent, children };
    setNavItems(copy);
  };

  const addSubMenuLevel3 = (parentIdx: number, sub2Idx: number) => {
    soundEngine.playClick();
    const copy = [...navItems];
    const sub2List = [...(copy[parentIdx].children || [])];
    const sub2 = sub2List[sub2Idx];
    const sub3List = Array.isArray(sub2.children) ? [...sub2.children] : [];
    sub3List.push({
      id: "sub3_" + Date.now(),
      title: "زیرمجموعه سطح ۳",
      url: "/products?search=" + encodeURIComponent(sub2.title),
      is_active: true,
    });
    sub2List[sub2Idx] = { ...sub2, children: sub3List };
    copy[parentIdx] = { ...copy[parentIdx], children: sub2List };
    setNavItems(copy);
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setEditingOriginalName("");
    setCatName("");
    setCatSlug("");
    setCatIcon("💻");
    setCatDesc("");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    soundEngine.playClick();
    setSaving(true);

    try {
      // اگر نام دسته‌بندی در حال ویرایش تغییر کرده باشد، نام آن روی کالاهای کاتالوگ هم به‌روز شود
      if (editingOriginalName && editingOriginalName !== catName.trim()) {
        await fetch("/api/admin/categories/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldName: editingOriginalName,
            newName: catName.trim(),
          }),
        }).catch(() => null);
      }

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
        resetCategoryForm();
        fetchMenusAndCategories();
      } else {
        notify(json.message || "خطا در ثبت دسته‌بندی.", "error");
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
      if (res.ok) {
        soundEngine.playSuccess();
        notify("✓ دسته‌بندی حذف شد.");
        if (editingCatId === id) resetCategoryForm();
        fetchMenusAndCategories();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 font-sans select-text text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4">
        <div>
          <h2 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>🧭</span> مهندسی درخت منو، زیرمنوهای ۳ سطحی هوشمند و دسته‌بندی‌ها
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            قابلیت ساخت منو، زیرمنو و زیرمجموعه زیرمنو به همراه پیشنهادگر هوشمند درختی و اتصال به کاتالوگ
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto text-xs font-black">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("menus");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeTab === "menus"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            🌳 درخت منو و زیرمنو ({navItems.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("categories");
            }}
            className={
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl transition cursor-pointer " +
              (activeTab === "categories"
                ? "bg-[var(--accent-blue)] text-white shadow-md"
                : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]")
            }
          >
            📁 دسته‌بندی‌های کاتالوگ ({categories.length})
          </button>
        </div>
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

      {activeTab === "menus" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
          <div className="lg:col-span-4 space-y-4">
            <form
              onSubmit={handleAddMenuItem}
              className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3.5"
            >
              <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-2.5">
                ➕ افزودن سرشاخه منوی اصلی (سطح ۱)
              </h3>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان منوی مادر *
                </label>
                <input
                  type="text"
                  required
                  value={newMenuTitle}
                  onChange={(e) => setNewMenuTitle(e.target.value)}
                  placeholder="مثال: تجهیزات خانه"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                    انتخاب سریع از دسته‌بندی‌های فروشگاه (اختیاری):
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (!newMenuTitle.trim()) setNewMenuTitle(val);
                      setNewMenuUrl("/products?category=" + encodeURIComponent(val));
                    }}
                    className="w-full p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer"
                  >
                    <option value="">-- انتخاب دسته‌بندی جهت لینک خودکار --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.icon || "📁"} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  آدرس لینک مقصد:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={newMenuUrl}
                  onChange={(e) => setNewMenuUrl(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
              >
                افزودن و ذخیره منوی مادر +
              </button>
            </form>

            {/* موتور پیشنهادگر هوشمند زیرمنوهای ۳ سطحی */}
            <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-indigo-500/30 shadow-xl space-y-3">
              <h3 className="font-black text-xs text-indigo-400 flex items-center gap-1.5">
                <span>🤖</span> پیشنهادگر هوشمند درخت منو و زیرمنو (۳ سطحی):
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                با یک کلیک، ساختار کامل منو، زیرمنو و زیرمجموعه سطح سوم را به درخت منوی سایت اضافه کنید:
              </p>
              <div className="space-y-2">
                {SMART_TREE_TEMPLATES.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInjectSmartTemplate(item.tree)}
                    className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-indigo-500 text-right font-bold text-[11px] transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-indigo-400 shrink-0">+ افزودن</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ویرایشگر درختی ۳ سطحی منو و زیرمنوها */}
          <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="font-black text-sm">ویرایشگر کامل منوها و زیرمنوهای تو در تو</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  ترتیب، عنوان، لینک و زیرمنوهای هر بخش را تنظیم کرده و روی دکمه ذخیره کلیک کنید
                </p>
              </div>
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => syncHeaderNavigationEverywhere(navItems)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer shadow-lg transition disabled:opacity-50"
              >
                {saving ? "در حال ذخیره..." : "💾 ذخیره و انتشار درخت منو در کل سایت"}
              </button>
            </div>

            <div className="space-y-4">
              {navItems.map((item, pIdx) => (
                <div
                  key={item.id}
                  className={
                    "p-4 rounded-2xl bg-[var(--input-bg)] border space-y-3 transition " +
                    (item.is_active === false
                      ? "border-rose-500/20 opacity-65"
                      : "border-[var(--card-border)]")
                  }
                >
                  {/* سطح ۱ */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...navItems];
                          copy[pIdx] = { ...copy[pIdx], title: e.target.value };
                          setNavItems(copy);
                        }}
                        className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black outline-none focus:border-[var(--accent-blue)]"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={item.url}
                        onChange={(e) => {
                          const copy = [...navItems];
                          copy[pIdx] = { ...copy[pIdx], url: e.target.value };
                          setNavItems(copy);
                        }}
                        className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono outline-none focus:border-[var(--accent-blue)]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        disabled={pIdx === 0}
                        onClick={() => handleMoveMenuItem(pIdx, "up")}
                        title="انتقال به بالا"
                        className="px-2 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬆️
                      </button>
                      <button
                        type="button"
                        disabled={pIdx === navItems.length - 1}
                        onClick={() => handleMoveMenuItem(pIdx, "down")}
                        title="انتقال به پایین"
                        className="px-2 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...navItems];
                          copy[pIdx] = { ...copy[pIdx], is_active: item.is_active === false };
                          setNavItems(copy);
                        }}
                        className={
                          "px-2.5 py-1.5 rounded-xl text-[10px] font-black cursor-pointer " +
                          (item.is_active !== false
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
                        }
                      >
                        {item.is_active !== false ? "فعال ✓" : "مخفی"}
                      </button>
                      <button
                        type="button"
                        onClick={() => addSubMenuLevel2(pIdx)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 font-black text-[11px] cursor-pointer"
                      >
                        + زیرمنو (سطح ۲)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = navItems.filter((x) => x.id !== item.id);
                          setNavItems(next);
                          syncHeaderNavigationEverywhere(next);
                        }}
                        className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition"
                        title="حذف منو"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* سطح ۲ */}
                  {Array.isArray(item.children) && item.children.length > 0 && (
                    <div className="pr-4 sm:pr-6 border-r-2 border-[var(--accent-blue)]/40 space-y-2.5">
                      {item.children.map((sub2, s2Idx) => (
                        <div
                          key={sub2.id}
                          className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                              <input
                                type="text"
                                value={sub2.title}
                                onChange={(e) => {
                                  const copy = [...navItems];
                                  const c2 = [...(copy[pIdx].children || [])];
                                  c2[s2Idx] = { ...c2[s2Idx], title: e.target.value };
                                  copy[pIdx] = { ...copy[pIdx], children: c2 };
                                  setNavItems(copy);
                                }}
                                className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none"
                              />
                              <input
                                type="text"
                                dir="ltr"
                                value={sub2.url}
                                onChange={(e) => {
                                  const copy = [...navItems];
                                  const c2 = [...(copy[pIdx].children || [])];
                                  c2[s2Idx] = { ...c2[s2Idx], url: e.target.value };
                                  copy[pIdx] = { ...copy[pIdx], children: c2 };
                                  setNavItems(copy);
                                }}
                                className="p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => addSubMenuLevel3(pIdx, s2Idx)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold text-[10px] cursor-pointer"
                              >
                                + زیرمجموعه (سطح ۳)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...navItems];
                                  copy[pIdx] = {
                                    ...copy[pIdx],
                                    children: (copy[pIdx].children || []).filter(
                                      (x) => x.id !== sub2.id
                                    ),
                                  };
                                  setNavItems(copy);
                                  syncHeaderNavigationEverywhere(copy);
                                }}
                                className="p-1.5 px-2 rounded-lg bg-rose-500/15 text-rose-400 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* سطح ۳ */}
                          {Array.isArray(sub2.children) && sub2.children.length > 0 && (
                            <div className="pr-4 border-r-2 border-indigo-500/40 space-y-1.5 pt-1">
                              {sub2.children.map((sub3, s3Idx) => (
                                <div key={sub3.id} className="flex items-center gap-2">
                                  <span className="text-indigo-400 font-bold">↳</span>
                                  <input
                                    type="text"
                                    value={sub3.title}
                                    onChange={(e) => {
                                      const copy = [...navItems];
                                      const c2 = [...(copy[pIdx].children || [])];
                                      const c3 = [...(c2[s2Idx].children || [])];
                                      c3[s3Idx] = { ...c3[s3Idx], title: e.target.value };
                                      c2[s2Idx] = { ...c2[s2Idx], children: c3 };
                                      copy[pIdx] = { ...copy[pIdx], children: c2 };
                                      setNavItems(copy);
                                    }}
                                    className="flex-1 p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold outline-none"
                                  />
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={sub3.url}
                                    onChange={(e) => {
                                      const copy = [...navItems];
                                      const c2 = [...(copy[pIdx].children || [])];
                                      const c3 = [...(c2[s2Idx].children || [])];
                                      c3[s3Idx] = { ...c3[s3Idx], url: e.target.value };
                                      c2[s2Idx] = { ...c2[s2Idx], children: c3 };
                                      copy[pIdx] = { ...copy[pIdx], children: c2 };
                                      setNavItems(copy);
                                    }}
                                    className="flex-1 p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-mono outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = [...navItems];
                                      const c2 = [...(copy[pIdx].children || [])];
                                      c2[s2Idx] = {
                                        ...c2[s2Idx],
                                        children: (c2[s2Idx].children || []).filter(
                                          (x) => x.id !== sub3.id
                                        ),
                                      };
                                      copy[pIdx] = { ...copy[pIdx], children: c2 };
                                      setNavItems(copy);
                                      syncHeaderNavigationEverywhere(copy);
                                    }}
                                    className="p-1.5 text-rose-400 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-4 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black text-sm text-[var(--accent-blue)]">
                {editingCatId ? "✏️ ویرایش دسته‌بندی" : "➕ ایجاد دسته‌بندی محصول جدید"}
              </h3>
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-[11px] text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  انصراف ✕
                </button>
              )}
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                نام دسته‌بندی *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="مثال: کالای دیجیتال"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  نامک (Slug)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="digital-goods"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  آیکون
                </label>
                <input
                  type="text"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  placeholder="💻"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                توضیح کوتاه دسته‌بندی (اختیاری)
              </label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="توضیحات سئو دسته‌بندی..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black shadow-lg cursor-pointer hover:opacity-90 transition disabled:opacity-50"
            >
              {editingCatId ? "💾 بروزرسانی دسته‌بندی" : "💾 ذخیره دسته‌بندی"}
            </button>
          </form>

          <div className="lg:col-span-8 p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
            {categories.length === 0 ? (
              <div className="sm:col-span-2 py-10 text-center text-slate-400 font-bold">
                هنوز دسته‌بندی ثبت نشده است.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-base shrink-0">{cat.icon || "📁"}</span>
                    <div className="overflow-hidden">
                      <span className="font-black block truncate">{cat.name}</span>
                      {cat.slug && (
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          /{cat.slug}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setEditingCatId(cat.id);
                        setEditingOriginalName(cat.name);
                        setCatName(cat.name);
                        setCatSlug(cat.slug || "");
                        setCatIcon(cat.icon || "📁");
                        setCatDesc(cat.description || "");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] cursor-pointer"
                      title="ویرایش دسته‌بندی"
                    >
                      ✏️
                    </button>
                    {!String(cat.id).startsWith("cat_") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer transition"
                        title="حذف دسته‌بندی"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMenu;