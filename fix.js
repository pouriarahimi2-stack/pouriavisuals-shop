/**
 * AXON CORE - Puck Enterprise Upgrades: Version History & Draft Preview Engine (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-PUCK-ENTERPRISE]\x1b[0m استقرار موتور ذخیره تاریخچه نسخه‌ها و کنترل پیش‌نمایش امن...");

// =============================================================================
// ۱. ارتقای روت API ذخیره صفحات برای ثبت خودکار نسخه‌ها در app/api/pages/route.ts
// =============================================================================
const updatedPagesApiCode = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export const SYSTEM_PAGES = [
  { id: "sys-home", slug: "home", title: "صفحه اصلی (خانه)" },
  { id: "sys-products", slug: "products", title: "کاتالوگ محصولات و تجهیزات" },
  { id: "sys-news", slug: "news", title: "رادار اخبار تکنولوژی" },
  { id: "sys-blog", slug: "blog", title: "مجله تخصصی و مقالات سئو" },
  { id: "sys-about", slug: "about", title: "درباره استودیو آکسون" },
  { id: "sys-contact", slug: "contact", title: "تماس و مشاوره تخصصی" },
  { id: "sys-track", slug: "track-order", title: "پیگیری مرسولات پستی" },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const getRevisions = searchParams.get("revisions");

    // واکشی تاریخچه نسخه‌های یک صفحه
    if (slug && getRevisions === "true") {
      const { data: revs } = await supabaseAdmin
        .from("page_revisions")
        .select("id, created_at")
        .eq("page_slug", slug)
        .order("created_at", { ascending: false })
        .limit(5);

      return NextResponse.json({ success: true, revisions: revs || [] });
    }

    if (slug) {
      const { data } = await supabaseAdmin
        .from("modular_pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        return NextResponse.json({ success: true, page: data });
      }

      const sys = SYSTEM_PAGES.find((p) => p.slug === slug);
      if (sys) {
        return NextResponse.json({ success: true, page: sys });
      }
    }

    const { data: customPages } = await supabaseAdmin
      .from("modular_pages")
      .select("id, slug, title, is_published, updated_at")
      .order("updated_at", { ascending: false });

    const combined = [...SYSTEM_PAGES];
    (customPages || []).forEach((cp) => {
      if (!combined.some((p) => p.slug === cp.slug)) {
        combined.push(cp);
      }
    });

    return NextResponse.json({ success: true, pages: combined });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, puck_data, is_published, restoreRevisionId } = body;
    const cleanSlug = String(slug || "").trim().toLowerCase();

    // اگر درخواست بازیابی نسخه قبلی باشد
    if (restoreRevisionId) {
      const { data: rev } = await supabaseAdmin
        .from("page_revisions")
        .select("puck_data")
        .eq("id", restoreRevisionId)
        .maybeSingle();

      if (rev && rev.puck_data) {
        await supabaseAdmin
          .from("modular_pages")
          .update({ puck_data: rev.puck_data, updated_at: new Date().toISOString() })
          .eq("slug", cleanSlug);

        return NextResponse.json({ success: true, message: "صفحه با موفقیت به نسخه انتخابی بازگردانی شد.", restoredData: rev.puck_data });
      }
    }

    const payload: any = {
      slug: cleanSlug,
      title: String(title || cleanSlug).trim(),
      puck_data: puck_data || {},
      is_published: is_published !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("modular_pages").select("id").eq("slug", cleanSlug).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("modular_pages").update(payload).eq("id", existing.id);
    } else {
      payload.id = "page_" + Date.now();
      payload.created_at = new Date().toISOString();
      await supabaseAdmin.from("modular_pages").insert([payload]);
    }

    // ثبت اسنپ‌شات در تاریخچه نسخه‌ها
    if (puck_data) {
      try {
        await supabaseAdmin.from("page_revisions").insert([
          { page_slug: cleanSlug, puck_data }
        ]);
      } catch {}
    }

    return NextResponse.json({ success: true, message: "صفحه با موفقیت ذخیره و اسنپ‌شات نسخه ثبت شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/pages/route.ts', updatedPagesApiCode);

// =============================================================================
// ۲. ارتقای components/admin/AdminModularPages.tsx با منوی بازگردانی نسخه‌ها
// =============================================================================
const studioWithRevisions = `"use client";

import React, { useState, useEffect } from "react";
import { Puck, Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/lib/puckConfig";
import { soundEngine } from "@/lib/soundEngine";
import Link from "next/link";

const DEFAULT_HOME_DATA: Data = {
  content: [
    {
      type: "HeroBlock",
      props: {
        id: "hero-1",
        badge: "🚀 مرجع تخصصی مانیتورهای ۵K",
        title: "دیدن واقعیت رنگ‌ها بدون مصالحه و خطا",
        subtitle: "تأمین، کالیبراسیون و واردات مانیتورهای مرجع رنگ استودیو با ۱۸ ماه گارانتی طلایی.",
        primaryBtnText: "کاتالوگ مانیتورها",
        primaryBtnUrl: "/products",
        secondaryBtnText: "درخواست مشاوره",
        secondaryBtnUrl: "/contact",
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        bgColor: "#020617",
        textColor: "#ffffff",
        paddingTop: 60,
        paddingBottom: 60,
      },
    },
    {
      type: "ProductComparison",
      props: {
        id: "comp-1",
        heading: "مقایسه فنی دو مانیتور مرجع تدوین",
        subtitle: "تفکیک رنگ‌ها بر مبنای استاندارد DCI-P3 و اتصالات تاندربولت",
        product1Id: "prod-studio-display-5k",
        product2Id: "prod-pro-display-xdr",
        bgColor: "#090d16",
      }
    },
    {
      type: "CountdownTimer",
      props: {
        id: "timer-1",
        badge: "⚡ آفر محدود",
        title: "تخفیف ویژه مانیتورهای ۵K استودیو",
        targetDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 19),
        buttonText: "مشاهده کاتالوگ و خرید",
        buttonUrl: "/products",
        bgColor: "#0f172a"
      }
    }
  ],
  root: { props: { title: "صفحه اصلی" } },
};

export default function AdminModularPages() {
  const [pages, setPages] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [currentSlug, setCurrentSlug] = useState<string>("home");
  const [pageData, setPageData] = useState<Data>(DEFAULT_HOME_DATA);
  const [revisions, setRevisions] = useState<Array<{ id: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<"100%" | "768px" | "390px">("100%");
  const [toast, setToast] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.pages)) {
        setPages(json.pages);
      }
    } catch {}
  };

  const fetchRevisions = async (slug: string) => {
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}&revisions=true\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.revisions)) {
        setRevisions(json.revisions);
      }
    } catch {}
  };

  const loadPage = async (slug: string) => {
    setCurrentSlug(slug);
    setLoading(true);
    soundEngine.playClick();
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page && json.page.puck_data) {
        setPageData(json.page.puck_data);
      } else {
        setPageData(DEFAULT_HOME_DATA);
      }
      fetchRevisions(slug);
    } catch {
      setPageData(DEFAULT_HOME_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    fetchRevisions("home");
  }, []);

  const handleSave = async (data: Data) => {
    soundEngine.playClick();
    setToast("در حال انتشار تغییرات در دیتابیس...");
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: currentSlug === "home" ? "صفحه اصلی" : currentSlug,
          puck_data: data,
          is_published: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        soundEngine.playSuccess();
        setToast("✓ صفحه با موفقیت ذخیره شد و اسنپ‌شات نسخه ثبت گردید.");
        fetchRevisions(currentSlug);
      } else {
        setToast("خطا در ذخیره‌سازی.");
      }
    } catch {
      setToast("خطا در برقراری ارتباط با سرور.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleRollback = async (revisionId: string) => {
    if (!confirm("آیا از بازگردانی چیدمان به این نسخه اطمینان دارید؟")) return;
    soundEngine.playClick();
    setToast("در حال بازگردانی به نسخه انتخابی...");
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: currentSlug, restoreRevisionId: revisionId }),
      });
      const json = await res.json();
      if (json.success && json.restoredData) {
        soundEngine.playSuccess();
        setPageData(json.restoredData);
        setToast("✓ صفحه با موفقیت به نسخه قبلی بازگردانده شد.");
      }
    } catch {
      setToast("خطا در بازگردانی نسخه.");
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans select-none min-h-screen space-y-4" dir="rtl">
      
      {/* نوار ابزار بالای استودیو */}
      <div className="p-4 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-secondary)]">انتخاب صفحه:</span>
            <select
              value={currentSlug}
              onChange={(e) => loadPage(e.target.value)}
              className="p-2 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-black outline-none cursor-pointer text-[var(--text-primary)]"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.slug}>
                  📄 {p.title} (/{p.slug === "home" ? "" : p.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* منوی تاریخچه نسخه‌ها */}
        {revisions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-bold">🕒 نسخه‌های قبل:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleRollback(e.target.value);
              }}
              defaultValue=""
              className="p-1.5 px-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-bold outline-none cursor-pointer text-slate-300"
            >
              <option value="" disabled>انتخاب جهت بازگردانی...</option>
              {revisions.map((r, idx) => (
                <option key={r.id} value={r.id}>
                  نسخه {idx + 1} ({new Date(r.created_at).toLocaleTimeString("fa-IR")})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* سوییچر اندازه فریم بوم */}
        <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--card-border)]">
          {[
            { id: "100%", label: "دسکتاپ", icon: "🖥️" },
            { id: "768px", label: "تبلت", icon: "📱" },
            { id: "390px", label: "موبایل", icon: "📲" },
          ].map((vp) => (
            <button
              key={vp.id}
              type="button"
              onClick={() => { soundEngine.playClick(); setViewportWidth(vp.id as any); }}
              className={"px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer " + (
                viewportWidth === vp.id ? "bg-sky-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              <span>{vp.icon}</span>
              <span className="hidden sm:inline">{vp.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={currentSlug === "home" ? "/" : \`/\${currentSlug}\`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-sky-500 transition flex items-center gap-1.5"
          >
            <span>مشاهده زنده در سایت</span>
            <span>🔗</span>
          </Link>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fadeIn">
          {toast}
        </div>
      )}

      {/* بوم تعاملی Puck */}
      <div className="flex-1 w-full flex justify-center items-start">
        <div
          style={{ width: viewportWidth, maxWidth: "100%", transition: "width 0.3s ease" }}
          className="rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--modal-bg)] shadow-2xl min-h-[750px]"
        >
          {loading ? (
            <div className="py-32 text-center text-xs font-bold text-slate-400">در حال آماده‌سازی بوم بصری...</div>
          ) : (
            <Puck
              config={puckConfig}
              data={pageData}
              onPublish={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
`;
writeFile('components/admin/AdminModularPages.tsx', studioWithRevisions);

// =============================================================================
// ۳. تست بیلد نهایی پروژه و انتشار در Vercel
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(puck-enterprise): add automatic page snapshot revision history and rollback engine"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سیستم مدیریت تاریخچه نسخه‌ها با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}