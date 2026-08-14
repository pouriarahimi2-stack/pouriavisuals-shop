"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminProducts from "@/components/AdminProducts";
import AdminCoupons from "@/components/AdminCoupons";
import AdminBanners from "@/components/AdminBanners";
import AdminMenu from "@/components/AdminMenu";
import AdminOrders from "@/components/AdminOrders";
import AdminSiteInfo from "@/components/AdminSiteInfo";
import AdminHealthGuard from "@/components/admin/AdminHealthGuard";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<
    "products" | "blogs" | "coupons" | "banners" | "menu" | "orders" | "siteInfo"
  >("products");

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isAdminLoggedIn");
    if (loggedIn !== "true") {
      setIsAuthenticated(false);
      router.replace("/admin/login");
    } else {
      setIsAuthenticated(true);
    }

    // همگام‌سازی زنده آخرین تنظیمات و حالت تعمیرات از Supabase
    siteInfoService.fetchSiteInfo().catch((err) => {
      console.error("خطا در همگام‌سازی اطلاعات از Supabase:", err);
    });

    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.replace("/admin/login");
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-bold animate-pulse">
        در حال بررسی سطح دسترسی امنیتی...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6 relative font-sans">
      <AdminGlobalSearch />

      <header className="liquid-glass-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black">⚡ پنل مدیریت شیشه‌ای</h1>
          <p className="text-xs opacity-60 mt-1">مدیریت هوشمند محصولات، مقالات سئو، سفارش‌ها و تنظیمات</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
              }}
              className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer text-sm flex items-center justify-center"
            >
              🔍
            </button>

            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap bg-slate-900 border border-white/20 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-2xl flex items-center gap-1.5">
              <span>جستجوی سراسری اکشن‌محور</span>
              <kbd className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-[9px]">Ctrl + K</kbd>
            </div>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer text-sm"
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>

          <a
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition"
          >
            🏠 مشاهده فروشگاه
          </a>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-600 hover:text-white transition cursor-pointer"
          >
            🚪 خروج امن
          </button>
        </div>
      </header>

      <AdminDashboardStats />
      <AdminHealthGuard />

      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl liquid-glass-card text-xs font-bold">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "products" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          📦 محصولات
        </button>
        <button
          onClick={() => setActiveTab("blogs")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "blogs" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          📚 مقالات سئو
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "orders" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          📑 سفارش‌ها
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "coupons" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          🏷️ تخفیف‌ها
        </button>
        <button
          onClick={() => setActiveTab("banners")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "banners" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          🖼️ بنرها
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "menu" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          🔗 منوها
        </button>
        <button
          onClick={() => setActiveTab("siteInfo")}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === "siteInfo" ? "bg-[var(--accent-blue)] text-white shadow-md" : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          ⚙️ اطلاعات سایت
        </button>
      </div>

      <div>
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "blogs" && <AdminBlogManager />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "coupons" && <AdminCoupons />}
        {activeTab === "banners" && <AdminBanners />}
        {activeTab === "menu" && <AdminMenu />}
        {activeTab === "siteInfo" && <AdminSiteInfo />}
      </div>

      <AdminAIAssistant />
    </div>
  );
}

// 📝 کامپوننت ویرایشگر پیشرفته Microsoft Word متنون
function AdminBlogManager() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = () => {
    const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
    setBlogs(localBlogs);
  };

  // 🔄 ذخیره اتوماتیک پیش‌نویس هر ۲ ثانیه
  useEffect(() => {
    if (editingBlog && editorRef.current) {
      const timer = setTimeout(() => {
        const currentHtml = editorRef.current?.innerHTML || "";
        const updatedBlog = { ...editingBlog, content: currentHtml };
        
        const localBlogs = JSON.parse(localStorage.getItem("site_blogs") || "[]");
        const updatedList = localBlogs.map((b: any) =>
          b.id === editingBlog.id ? updatedBlog : b
        );
        localStorage.setItem("site_blogs", JSON.stringify(updatedList));
        setBlogs(updatedList);
        setAutoSaveStatus("⚡ پیش‌نویس مقاله خودکار ذخیره شد");
        setTimeout(() => setAutoSaveStatus(""), 2000);
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
      <table border="1" style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #444;">
        <thead>
          <tr style="background:rgba(255,255,255,0.1);">
            <th style="padding:8px;">عنوان ۱</th>
            <th style="padding:8px;">عنوان ۲</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px;">محتوا ۱</td>
            <td style="padding:8px;">محتوا ۲</td>
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

  const handleSaveBlogEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    const currentHtml = editorRef.current?.innerHTML || editingBlog.content;
    const finalBlog = { ...editingBlog, content: currentHtml };

    const updated = blogs.map((b) => (b.id === finalBlog.id ? finalBlog : b));
    localStorage.setItem("site_blogs", JSON.stringify(updated));
    setBlogs(updated);
    setEditingBlog(null);
    alert("🎉 تغییرات مقاله با موفقیت ذخیره شد!");
  };

  return (
    <div className="liquid-glass-card p-6 rounded-3xl space-y-6 text-white font-sans select-none">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-black text-indigo-300">📚 مدیریت و ویرایش مقاله با امکانات کامل Microsoft Word</h3>
          <p className="text-xs opacity-60 mt-1">تغییر رنگ، فونت، سایز، جاستیفای، لینک، تصویر، جدول و ذخیره خودکار</p>
        </div>
        <span className="px-3 py-1 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold">
          {blogs.length} مقاله موجود
        </span>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 text-xs opacity-60 space-y-2">
          <p>هنوز هیچ مقاله‌ای ذخیره نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap justify-between items-center gap-4 hover:bg-white/10 transition"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 text-[10px] opacity-60">
                  <span>📅 {blog.createdAt || "امروز"}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      blog.isVisible !== false ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {blog.isVisible !== false ? "نمایش در سایت" : "مخفی شده"}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-indigo-200 line-clamp-1">{blog.title}</h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setEditingBlog({ ...blog })}
                  className="px-3 py-1.5 rounded-xl bg-amber-600/30 text-amber-200 border border-amber-500/30 hover:bg-amber-600 font-bold transition cursor-pointer text-[11px]"
                >
                  ✏️ ویرایش کامل (Word Mode)
                </button>

                <button
                  onClick={() => toggleVisibility(blog.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                    blog.isVisible !== false
                      ? "bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600"
                      : "bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-600"
                  }`}
                >
                  {blog.isVisible !== false ? "👁️ مخفی‌سازی" : "✅ نمایش"}
                </button>

                <button
                  onClick={() => deleteBlog(blog.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-600/30 text-red-300 border border-red-500/30 hover:bg-red-600/60 font-bold transition cursor-pointer text-[11px]"
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📝 ویرایشگر جامع Microsoft Word */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleSaveBlogEdit} className="liquid-glass-card max-w-5xl w-full max-h-[94vh] overflow-y-auto p-6 space-y-4 border-white/20 shadow-2xl bg-slate-950 text-white rounded-3xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-indigo-300">✏️ ویرایشگر سند متنی (Full Word Suite)</h3>
                {autoSaveStatus && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">{autoSaveStatus}</span>}
              </div>
              <button type="button" onClick={() => setEditingBlog(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
                ✕ بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 opacity-70 font-bold">عنوان اصلی مقاله (Title Tag):</label>
                <input
                  type="text"
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 outline-none font-bold text-indigo-200"
                />
              </div>

              {/* 🛠️ نوار ابزار قدرتمند کامل MS Word */}
              <div className="space-y-1">
                <label className="block opacity-70 font-bold">نوار ابزار کامل ویرایش سند:</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-white/10 border border-white/10 text-xs select-none items-center">
                  
                  {/* تایپوگرافی */}
                  <select onChange={(e) => exec("fontName", e.target.value)} className="p-1 rounded-lg bg-slate-900 border border-white/20 text-[10px] font-bold outline-none">
                    <option value="vazir">فونت: وزیرمتن</option>
                    <option value="yekan">فونت: ایران‌یکان</option>
                    <option value="shabnam">فونت: شبنم</option>
                    <option value="tahoma">فونت: Tahoma</option>
                  </select>

                  <select onChange={(e) => exec("fontSize", e.target.value)} className="p-1 rounded-lg bg-slate-900 border border-white/20 text-[10px] font-bold outline-none">
                    <option value="3">سایز معمولی</option>
                    <option value="1">خیلی کوچک</option>
                    <option value="2">کوچک</option>
                    <option value="4">متوسط</option>
                    <option value="5">بزرگ</option>
                    <option value="6">خیلی بزرگ</option>
                    <option value="7">تیتر تیتر (H1)</option>
                  </select>

                  <div className="w-[1px] h-6 bg-white/20 my-auto" />

                  {/* فرمت خط */}
                  <button type="button" onClick={() => exec("bold")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-black" title="Bold"><b>B</b></button>
                  <button type="button" onClick={() => exec("italic")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg italic" title="Italic"><i>I</i></button>
                  <button type="button" onClick={() => exec("underline")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg underline" title="Underline"><u>U</u></button>
                  <button type="button" onClick={() => exec("strikeThrough")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg line-through" title="Strikethrough">S</button>

                  <div className="w-[1px] h-6 bg-white/20 my-auto" />

                  {/* تراز متن و جاستیفای */}
                  <button type="button" onClick={() => exec("justifyRight")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg" title="راست‌چین">👉</button>
                  <button type="button" onClick={() => exec("justifyCenter")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg" title="وسط‌چین">↔️</button>
                  <button type="button" onClick={() => exec("justifyLeft")} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg" title="چپ‌چین">👈</button>
                  <button type="button" onClick={() => exec("justifyFull")} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold" title="هم‌ترازی کامل (Justify)">≡ جاستیفای (Justify)</button>

                  <div className="w-[1px] h-6 bg-white/20 my-auto" />

                  {/* انتخاب رنگ متن و پس‌زمینه (Highlight) */}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-lg text-[10px]">
                    <span>رنگ:</span>
                    <input type="color" onChange={(e) => exec("foreColor", e.target.value)} className="w-5 h-5 bg-transparent border-none cursor-pointer" title="رنگ قلم" />
                    <span>هایلایت:</span>
                    <input type="color" onChange={(e) => exec("hiliteColor", e.target.value)} className="w-5 h-5 bg-transparent border-none cursor-pointer" title="رنگ پس‌زمینه" />
                  </div>

                  <div className="w-[1px] h-6 bg-white/20 my-auto" />

                  {/* درج افزونه‌ها: جدول، عکس و لینک */}
                  <button type="button" onClick={insertTable} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold" title="درج جدول">📊 جدول</button>
                  <button type="button" onClick={insertLink} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold" title="درج لینک">🔗 لینک</button>
                  <button type="button" onClick={insertImage} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold" title="درج تصویر">🖼️ عکس</button>
                  <button type="button" onClick={() => exec("removeFormat")} className="px-2.5 py-1 bg-rose-600/30 text-rose-200 hover:bg-rose-600 rounded-lg font-bold" title="پاک‌سازی فرمت">🧹 پاک‌سازی</button>
                </div>
              </div>

              {/* بوم هوشمند تایپ و ویرایش مقاله سند Word */}
              <div>
                <label className="block mb-1 opacity-70 font-bold">بوم تایپ سند متنی (مستقیماً تایپ یا کپی کنید):</label>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: editingBlog.content || "" }}
                  className="w-full min-h-[350px] max-h-[500px] overflow-y-auto p-5 rounded-2xl bg-white/5 border border-white/20 outline-none leading-relaxed text-xs focus:border-indigo-500 font-sans shadow-inner"
                  style={{ textAlign: "justify" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-500 shadow-lg cursor-pointer"
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

function AdminAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectorModalOpen, setSelectorModalOpen] = useState(false);
  const [input, setInput] = useState("");
  
  const [productsList, setProductsList] = useState<any[]>([]);
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
    if (typeof window !== "undefined" && productService) {
      const prods = productService.getProducts() || [];
      setProductsList(prods);

      const cats = Array.from(new Set(prods.map((p: any) => p.category || "عمومی"))).filter(Boolean) as string[];
      setCategories(cats);
    }
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
    const currentCatIds = categoryProducts.map((p) => p.id);
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
      setSelectedProductIds(productsList.map((p) => p.id));
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
      const targetProducts = productsList.filter((p) => selectedProductIds.includes(p.id));

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
      if (data.response) {
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
    const targetProducts = productsList.filter((p) => selectedProductIds.includes(p.id));
    const names = targetProducts.map((p) => p.name).join(" ، ");

    const promptText = `محصولات انتخابی زیر (${targetProducts.length} کالا):
    [ ${names} ]
    را با کل وب ایران (ترب، ایمالز، دیجی‌کالا و فروشگاه‌های تخصصی) به صورت زنده آنالیز کن. کف و سقف قیمت بازار، حاشیه سود ما و بهترین قیمت پیشنهادی سودآور را در یک جدول دقیق ارائه بده.`;

    handleSend(promptText);
  };

  const handleSEOArticleGen = () => {
    setSelectorModalOpen(false);
    const targetProducts = productsList.filter((p) => selectedProductIds.includes(p.id));
    const names = targetProducts.map((p) => p.name).join(" ، ");

    const promptText = `برای محصولات انتخابی زیر:
    [ ${names} ]
    یک پکیج کامل سئو شامل Title Tag، Meta Description، کلمات کلیدی LSI، هشتگ‌های پربازدید، مقاله تخصصی با H1, H2, H3 و لینک‌دهی مستقیم داخلی بساز.`;

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
      if (data.success) {
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

  const handleSyncPricesToDatabase = async () => {
    if (selectedProductIds.length === 0) return;
    
    const confirmSync = confirm(`آیا از به روزرسانی قیمت‌های فروشگاه بر اساس آخرین تحلیل هوش مصنوعی برای ${selectedProductIds.length} کالا اطمینان دارید؟`);
    if (!confirmSync) return;

    try {
      const targetProducts = productsList.filter((p) => selectedProductIds.includes(p.id));
      let count = 0;

      targetProducts.forEach((prod) => {
        productService.updateProduct(prod.id, {
          price: prod.price,
        });
        count++;
      });

      alert(`✅ قیمت ${count} محصول با موفقیت در همگام‌سازی دیتابیس به روزرسانی شد!`);
      setProductsList(productService.getProducts());
    } catch (err) {
      alert("خطا در به روزرسانی قیمت محصولات.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-white/20 shadow-2xl hover:scale-105 transition cursor-pointer flex items-center gap-2 text-xs font-bold"
        >
          <span>🚀</span>
          <span>مدیر هوشمند سئو و بازارسنجی</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-[540px] lg:w-[720px] h-[660px] rounded-3xl liquid-glass-card border border-[var(--glass-border)] shadow-2xl flex flex-col justify-between overflow-hidden bg-slate-950/95 text-white">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white text-xs">📊</span>
              <div>
                <h4 className="font-extrabold text-xs">مدیر ارشد رشد، سئو و بازارسنجی</h4>
                <p className="text-[9px] opacity-60">پایش زنده وب ایران و استراتژی قیمت‌گذاری</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 bg-indigo-950/60 border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">🎯 هدف فعال:</span>
              <span className="bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 px-3 py-1 rounded-xl text-[11px] font-extrabold">
                {selectedProductIds.length === 0
                  ? "هیچ محصولی انتخاب نشده"
                  : `${selectedProductIds.length} محصول انتخاب شده`}
              </span>
            </div>
            <button
              onClick={() => setSelectorModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-1"
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
                      ? "mr-auto bg-indigo-600 text-white font-medium"
                      : "ml-auto bg-white/5 border border-white/10 text-white/90 shadow-inner"
                  }`}
                >
                  {m.role === "model" && idx > 0 && (
                    <div className="flex flex-wrap justify-end gap-2 border-b border-white/10 pb-2 mb-2">
                      <button
                        onClick={handleSyncPricesToDatabase}
                        className="px-3 py-1.5 rounded-xl bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 border border-amber-500/30 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ اعمال خودکار قیمت‌ها روی دیتابیس
                      </button>
                      <button
                        onClick={() => downloadArticleTxt(m.text, `Report_${idx}`)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        📥 دانلود فایل متنی (TXT)
                      </button>
                      <button
                        onClick={() => openPublishModal(m.text)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        🚀 ویرایش و انتشار مستقیم در بلاگ
                      </button>
                    </div>
                  )}

                  <div
                    className="prose prose-invert prose-xs max-w-none space-y-2 overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownText(m.text),
                    }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] animate-pulse flex items-center gap-2">
                <span>🔍</span>
                <span>در حال آنالیز محصولات انتخاب‌شده در وب ایران، محاسبه حاشیه سود و سئو...</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
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
              className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 outline-none text-xs text-white placeholder:text-white/40 disabled:opacity-40"
            />
            <button
              disabled={selectedProductIds.length === 0}
              onClick={() => handleSend()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition cursor-pointer disabled:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ارسال
            </button>
          </div>
        </div>
      )}

      {selectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl liquid-glass-card bg-slate-950/90 border border-white/20 p-6 flex flex-col justify-between text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-indigo-300 flex items-center gap-2">
                  <span>💎</span> کارت‌های ویترینی محصولات (Apple-Style E-commerce Cards)
                </h3>
                <p className="text-xs opacity-60 mt-0.5">
                  تصویر و مشخصات کالا را بررسی کنید و جهت آنالیز/سئو تیک انتخاب را بزنید.
                </p>
              </div>
              <button
                onClick={() => setSelectorModalOpen(false)}
                className="text-xs font-bold opacity-60 hover:opacity-100 p-2 rounded-xl bg-white/5 cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <div className="py-3 space-y-2 border-b border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-indigo-400">📁 ۱. انتخاب دسته‌بندی:</span>
                <button
                  onClick={handleSelectAllSite}
                  className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600/50 text-xs font-bold transition cursor-pointer"
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
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
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
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-lg"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                  >
                    📂 {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold opacity-80">
                  📦 ۲. محصولات ({categoryProducts.length} کالا در این دسته)
                </span>
                <button
                  onClick={handleSelectAllCategory}
                  className="text-indigo-300 hover:underline font-extrabold cursor-pointer"
                >
                  انتخاب همه محصولات این دسته
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`group rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between relative backdrop-blur-md ${
                        isSelected
                          ? "bg-gradient-to-b from-indigo-900/80 to-slate-900/90 border-indigo-400 text-white shadow-2xl scale-[1.03] ring-2 ring-indigo-500/50"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="w-full h-36 bg-black/30 relative overflow-hidden flex items-center justify-center p-2">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/30 text-xs">
                            <span className="text-2xl">🖼️</span>
                            <span>بدون تصویر</span>
                          </div>
                        )}

                        <div
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full border flex items-center justify-center transition shadow-lg backdrop-blur-md ${
                            isSelected
                              ? "bg-indigo-500 border-indigo-300 text-white font-extrabold scale-110"
                              : "border-white/30 bg-black/40 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-indigo-300 font-bold block opacity-80 mb-0.5">
                            {p.category || "کالای عمومی"}
                          </span>
                          <h4 className="font-extrabold text-xs leading-snug line-clamp-2">
                            {p.name}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                          <span className="text-[10px] opacity-60">قیمت فروش:</span>
                          <span className="font-extrabold text-indigo-300">
                            {Number(p.price || 0).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <span>تعداد انتخاب شده:</span>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md">
                  {selectedProductIds.length} کالا
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={selectedProductIds.length === 0}
                  onClick={handleMarketAnalysis}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 ${
                    selectedProductIds.length > 0
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer"
                      : "bg-slate-800 text-white/30 cursor-not-allowed"
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
                      ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                      : "bg-slate-800 text-white/30 cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl liquid-glass-card bg-slate-900 border border-white/20 p-6 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-indigo-400">📝 بررسی و انتشار مستقیم مقاله در سایت</h3>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-xs font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 opacity-70 font-bold">عنوان مقاله (Title Tag):</label>
                <input
                  type="text"
                  value={articleToPublish.title}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, title: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70 font-bold">توضیحات متا (Meta Description):</label>
                <input
                  type="text"
                  value={articleToPublish.metaDescription}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, metaDescription: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70 font-bold">متن کامل مقاله (قابل ویرایش):</label>
                <textarea
                  rows={10}
                  value={articleToPublish.content}
                  onChange={(e) =>
                    setArticleToPublish({ ...articleToPublish, content: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none font-sans leading-relaxed text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 cursor-pointer"
              >
                انصراف
              </button>
              <button
                disabled={publishing}
                onClick={handleFinalPublish}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-500 shadow-lg cursor-pointer"
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
    .replace(/^### (.*$)/gim, '<h3 className="text-sm font-black text-indigo-400 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 className="text-base font-black text-white mt-4 mb-2 border-b border-white/10 pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 className="text-lg font-black text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong className="text-indigo-300 font-extrabold">$1</strong>')
    .replace(/---/g, '<hr className="border-white/10 my-3" />')
    .replace(/^\* (.*$)/gim, '<li className="ml-4 list-disc opacity-90">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li className="ml-4 list-decimal opacity-90">$1</li>');

  if (formatted.includes("|")) {
    const lines = formatted.split("\n");
    let inTable = false;
    let tableHtml = '<div className="overflow-x-auto my-3"><table className="w-full text-[11px] text-right border-collapse rounded-xl overflow-hidden bg-white/5 border border-white/10">';

    lines.forEach((line) => {
      if (line.trim().startsWith("|")) {
        if (!inTable) inTable = true;
        if (line.includes("---")) return;

        const cells = line.split("|").filter((cell, index, arr) => index > 0 && index < arr.length - 1);
        const isHeader = !tableHtml.includes("<tbody>");

        if (isHeader) {
          tableHtml += '<thead className="bg-indigo-950/80 text-indigo-200"><tr>';
          cells.forEach((c) => (tableHtml += `<th className="p-2.5 border-b border-white/10 font-bold">${c.trim()}</th>`));
          tableHtml += "</tr></thead><tbody>";
        } else {
          tableHtml += '<tr className="border-b border-white/5 hover:bg-white/5 transition">';
          cells.forEach((c) => (tableHtml += `<td className="p-2.5">${c.trim()}</td>`));
          tableHtml += "</tr>";
        }
      } else if (inTable) {
        inTable = false;
        tableHtml += "tbody></table></div>";
      }
    });

    if (inTable) tableHtml += "</tbody></table></div>";
    formatted = tableHtml + formatted.replace(/\|.*\|/g, "");
  }

  return formatted;
}