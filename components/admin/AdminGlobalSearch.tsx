"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  type: "product" | "order" | "blog" | "message";
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
        const [prodsRes, ordersRes, postsRes, msgsRes] = await Promise.all([
          supabase.from("products").select("id, title, name, price, category").limit(8),
          supabase.from("orders").select("id, customer_name, customer, phone, total_amount").limit(8),
          supabase.from("posts").select("id, title, category").limit(8),
          supabase.from("contact_messages").select("id, full_name, phone, subject").limit(8),
        ]);

        const combined: SearchResult[] = [];

        (prodsRes.data || [])
          .filter((p: any) => (p.title || p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
          .forEach((p: any) => {
            combined.push({
              id: p.id,
              type: "product",
              title: p.title || p.name,
              subtitle: `کالا | دسته‌بندی: ${p.category || "عمومی"}`,
              extra: `${Number(p.price || 0).toLocaleString("fa-IR")} ت`,
            });
          });

        (ordersRes.data || [])
          .filter((o: any) => {
            const phone = o.phone || o.customer?.phone || "";
            const name = o.customer_name || o.customer?.fullName || o.customer?.name || "";
            const id = String(o.id || "");
            return phone.includes(q) || name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
          })
          .forEach((o: any) => {
            const name = o.customer_name || o.customer?.fullName || o.customer?.name || "مشتری";
            const phone = o.phone || o.customer?.phone || "---";
            combined.push({
              id: o.id,
              type: "order",
              title: `سفارش ${o.id} - ${name}`,
              subtitle: `شماره تماس: ${phone}`,
              extra: `${Number(o.total_amount || 0).toLocaleString("fa-IR")} ت`,
            });
          });

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

        (msgsRes.data || [])
          .filter((msg: any) => (msg.full_name || "").toLowerCase().includes(q) || (msg.subject || "").toLowerCase().includes(q) || (msg.phone || "").includes(q))
          .forEach((msg: any) => {
            combined.push({
              id: msg.id,
              type: "message",
              title: `پیام از طرف ${msg.full_name}`,
              subtitle: `موضوع: ${msg.subject || "پشتیبانی"} - تلفن: ${msg.phone}`,
            });
          });

        setResults(combined);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (type: SearchResult["type"]) => {
    setIsOpen(false);
    if (!onSelectTab) return;
    if (type === "product") onSelectTab("products");
    if (type === "order") onSelectTab("orders");
    if (type === "blog") onSelectTab("blogs");
    if (type === "message") onSelectTab("messages");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/75 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="w-full max-w-2xl rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-2xl overflow-hidden font-sans text-[var(--text-primary)]">
            <div className="p-4 border-b border-[var(--card-border)] flex items-center gap-3 bg-[var(--input-bg)]">
              <span className="text-lg">🔍</span>
              <input
                type="text"
                autoFocus
                placeholder="جستجو در محصولات، فاکتورهای سفارش، مشتریان، پیام‌ها و مقالات وبلاگ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <span className="text-[10px] font-mono bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-xl text-[var(--text-secondary)] font-bold">
                ESC
              </span>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto space-y-2 text-xs">
              {searching ? (
                <div className="text-center py-8 text-[var(--text-secondary)] font-bold animate-pulse">
                  در حال جستجوی بلادرنگ در پایگاه داده...
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] font-medium">
                  {query ? "موردی مطابق با جستجوی شما یافت نشد." : "نام کالا، شماره فاکتور یا شماره موبایل را وارد نمایید."}
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleNavigate(item.type)}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-transparent transition cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm shadow-inner">
                        {item.type === "product" ? "📦" : item.type === "order" ? "📑" : item.type === "blog" ? "📚" : "✉️"}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-[var(--text-primary)]">{item.title}</h4>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">{item.subtitle}</span>
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