"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  type: "product" | "order" | "blog";
  title: string;
  subtitle: string;
  extra?: string;
}

export default function AdminGlobalSearch({ onSelectTab }: { onSelectTab?: (tab: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const q = query.trim().toLowerCase();

      try {
        const [prodsRes, ordersRes, postsRes] = await Promise.all([
          supabase.from("products").select("id, title, name, price, category").limit(5),
          supabase.from("orders").select("id, first_name, last_name, phone, total_amount").limit(5),
          supabase.from("posts").select("id, title, category").limit(5),
        ]);

        const combined: SearchResult[] = [];

        // فیلتر محصولات
        (prodsRes.data || [])
          .filter((p: any) => (p.title || p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
          .forEach((p: any) => {
            combined.push({
              id: p.id,
              type: "product",
              title: p.title || p.name,
              subtitle: `کالا | دسته: ${p.category || "عمومی"}`,
              extra: `${Number(p.price || 0).toLocaleString("fa-IR")} تومان`,
            });
          });

        // فیلتر سفارش‌ها
        (ordersRes.data || [])
          .filter((o: any) => (o.phone || "").includes(q) || `${o.first_name || ""} ${o.last_name || ""}`.toLowerCase().includes(q))
          .forEach((o: any) => {
            combined.push({
              id: o.id,
              type: "order",
              title: `سفارش: ${o.first_name || ""} ${o.last_name || ""}`.trim() || o.phone,
              subtitle: `فاکتور مشتری | تلفن: ${o.phone}`,
              extra: `${Number(o.total_amount || 0).toLocaleString("fa-IR")} تومان`,
            });
          });

        // فیلتر مقالات
        (postsRes.data || [])
          .filter((post: any) => (post.title || "").toLowerCase().includes(q) || (post.category || "").toLowerCase().includes(q))
          .forEach((post: any) => {
            combined.push({
              id: post.id,
              type: "blog",
              title: post.title,
              subtitle: `مقاله سئو | موضوع: ${post.category || "مجله"}`,
            });
          });

        setResults(combined);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (type: SearchResult["type"]) => {
    setIsOpen(false);
    if (!onSelectTab) return;
    if (type === "product") onSelectTab("products");
    if (type === "order") onSelectTab("orders");
    if (type === "blog") onSelectTab("blogs");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)]">
            <div className="p-4 border-b border-[var(--card-border)] flex items-center gap-3 bg-[var(--input-bg)]">
              <span className="text-base">🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="جستجو میان محصولات، فاکتورهای سفارش، شماره تماس و مقالات..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <span className="text-[10px] font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded-lg text-[var(--text-muted)] font-bold">
                ESC
              </span>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-1.5 text-xs">
              {searching ? (
                <div className="text-center py-6 text-[var(--text-muted)] font-bold animate-pulse">
                  در حال جستجوی بلادرنگ در دیتابیس...
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-muted)] font-medium">
                  {query ? "هیچ نتیجه‌ای یافت نشد." : "عبارت مورد نظر را تایپ کنید (مثلاً نام کالا یا شماره موبایل)"}
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleNavigate(item.type)}
                    className="p-3 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-transparent transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-sm">
                        {item.type === "product" ? "📦" : item.type === "order" ? "📄" : "📚"}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.title}</h4>
                        <span className="text-[10px] text-[var(--text-secondary)]">{item.subtitle}</span>
                      </div>
                    </div>
                    {item.extra && (
                      <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                        {item.extra}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}