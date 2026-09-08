/**
 * AXON CORE - Dynamic Customizable 3D Contact Dock Engine & Realtime Sync (fix.js)
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

console.log("\x1b[36m[AXON-DOCK]\x1b[0m داینامیک‌سازی کامل کلیدهای داک ارتباطی، اتصال به دیتابیس و همگام‌سازی بلادرنگ...");

// =============================================================================
// ۱. بازنویسی components/ContactDock.tsx به ساختار کاملاً پویا و زنده
// =============================================================================
const contactDockComponent = `"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export interface DockKeyItem {
  id: string;
  letter: string;
  title: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", url: "tel:02188888888" },
  { id: "k2", letter: "O", title: "سفارش‌ها", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار سخت‌افزار", url: "/news" },
  { id: "k4", letter: "T", title: "تلگرام پشتیبانی", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره استودیو", url: "/about" },
  { id: "k6", letter: "C", title: "مشاوره آنلاین", url: "/contact" },
  { id: "k7", letter: "T", title: "محصولات برتر", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const loadDockSettings = async () => {
    try {
      const info = await siteInfoService.getSiteInfo();
      if (info && (info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
        setDockKeys((info as any).contact_dock_items);
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    // شنونده رویدادهای محلی
    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      } else {
        loadDockSettings();
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    // وب‌سوکت بلادرنگ CDC دیتابیس Supabase
    const channel = supabase
      .channel("realtime-dock-keys")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadDockSettings();
      })
      .subscribe();

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  if (dockKeys.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 font-sans select-none py-4" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">شبکه‌های ارتباطی و اجتماعی استودیو:</span>
      </div>

      <div className="p-2.5 px-4 rounded-full bg-slate-950/80 border border-slate-800/80 shadow-2xl backdrop-blur-2xl flex items-center gap-2 relative overflow-visible">
        {dockKeys.map((k) => {
          const isHovered = hoveredKey === k.id;
          return (
            <div key={k.id} className="relative group">
              <a
                href={k.url || "#"}
                target={k.url?.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                onMouseEnter={() => {
                  soundEngine.playClick();
                  setHoveredKey(k.id);
                }}
                onMouseLeave={() => setHoveredKey(null)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/90 border border-slate-700/60 hover:border-[var(--accent-blue)] text-white hover:text-[var(--accent-blue)] flex items-center justify-center font-black text-sm transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg shadow-black/40 cursor-pointer"
              >
                <span>{k.letter}</span>
              </a>

              {/* تولتیپ سه بعدی عنوان کلید */}
              {isHovered && (
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-[10px] font-bold whitespace-nowrap shadow-xl animate-fadeIn z-50 pointer-events-none">
                  {k.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-400 font-medium">
        روی کلیدها نگه دارید تا فلیپ سه‌بعدی فعال شود
      </span>
    </div>
  );
}
`;
writeFile('components/ContactDock.tsx', contactDockComponent);

// =============================================================================
// ۲. به‌روزرسانی روت سروری app/api/site-info/route.ts برای پذیرش contact_dock_items
// =============================================================================
const siteInfoApiContent = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("site_info")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, data });
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
    const { data: existing } = await supabaseAdmin.from("site_info").select("id").limit(1);

    const payload: Record<string, any> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabaseAdmin.from("site_info").update(payload).eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("site_info").insert([payload]);
    }

    return NextResponse.json({ success: true, message: "تنظیمات با موفقیت ذخیره شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/site-info/route.ts', siteInfoApiContent);

// =============================================================================
// ۳. افزودن ماژول مدیریت کلیدهای داک در صفحه تنظیمات ادمین (components/AdminSiteInfo.tsx)
// =============================================================================
const adminSiteInfoFile = path.join(process.cwd(), 'components/AdminSiteInfo.tsx');
let adminSiteInfoContent = fs.readFileSync(adminSiteInfoFile, 'utf8');

if (!adminSiteInfoContent.includes('contact_dock_items')) {
  // تزریق استیت و قابلیت مدیریت داک کلیدها در کامپوننت
  adminSiteInfoContent = adminSiteInfoContent.replace(
    'export default function AdminSiteInfo() {',
    `export default function AdminSiteInfo() {
  const [dockKeys, setDockKeys] = useState<Array<{ id: string; letter: string; title: string; url: string }>>([
    { id: "k1", letter: "C", title: "تماس تلفنی", url: "tel:02188888888" },
    { id: "k2", letter: "O", title: "سفارش‌ها", url: "/track-order" },
    { id: "k3", letter: "N", title: "اخبار سخت‌افزار", url: "/news" },
    { id: "k4", letter: "T", title: "تلگرام", url: "https://t.me/axoncore" },
    { id: "k5", letter: "A", title: "درباره ما", url: "/about" },
    { id: "k6", letter: "C", title: "مشاوره آنلاین", url: "/contact" },
    { id: "k7", letter: "T", title: "محصولات", url: "/products" },
  ]);
  const [newKeyLetter, setNewKeyLetter] = useState("");
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [newKeyUrl, setNewKeyUrl] = useState("");`
  );

  // واکشی کلیدها از دیتابیس در useEffect
  adminSiteInfoContent = adminSiteInfoContent.replace(
    'if (data) {',
    `if (data) {
        if ((data as any).contact_dock_items && Array.isArray((data as any).contact_dock_items)) {
          setDockKeys((data as any).contact_dock_items);
        }`
  );

  // الحاق کلیدها به payload ذخیره
  adminSiteInfoContent = adminSiteInfoContent.replace(
    'const payload = {',
    `const payload = {
        contact_dock_items: dockKeys,`
  );

  // افزودن بخش گرافیکی مدیریت کلیدهای داک در فرم
  const dockUiSection = `
        {/* بخش مدیریت کلیدهای داک سه‌بعدی ارتباطی */}
        <div className="p-6 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
            <div>
              <h4 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-1.5">
                <span>🎛️</span>
                <span>مدیریت کلیدهای داک سه‌بعدی ارتباطی (CONTACT Dock)</span>
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                تنظیم حروف، لینک‌ها، عنوان‌ها و افزایش یا کاهش تعداد کلیدهای ارتباطی
              </p>
            </div>
            <span className="font-mono font-bold text-xs bg-[var(--modal-bg)] px-3 py-1 rounded-xl border border-[var(--card-border)]">
              {dockKeys.length} کلید فعال
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[var(--modal-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
            <input
              type="text"
              maxLength={2}
              placeholder="حرف کلید (مثلا C)"
              value={newKeyLetter}
              onChange={(e) => setNewKeyLetter(e.target.value.toUpperCase())}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-black text-center text-xs uppercase"
            />
            <input
              type="text"
              placeholder="عنوان کلید (تولتیپ)"
              value={newKeyTitle}
              onChange={(e) => setNewKeyTitle(e.target.value)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs"
            />
            <input
              type="text"
              placeholder="پیوند مقصد (URL)"
              value={newKeyUrl}
              onChange={(e) => setNewKeyUrl(e.target.value)}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!newKeyLetter.trim()) return;
                soundEngine.playClick();
                const newK = {
                  id: "key_" + Date.now(),
                  letter: newKeyLetter.trim(),
                  title: newKeyTitle.trim() || "پیوند",
                  url: newKeyUrl.trim() || "#",
                };
                setDockKeys([...dockKeys, newK]);
                setNewKeyLetter("");
                setNewKeyTitle("");
                setNewKeyUrl("");
              }}
              className="p-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer hover:opacity-90 shadow-sm"
            >
              + افزودن کلید
            </button>
          </div>

          <div className="space-y-2">
            {dockKeys.map((k, idx) => (
              <div key={k.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--modal-bg)] border border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-black text-xs">
                    {k.letter}
                  </span>
                  <div>
                    <span className="font-bold text-xs block">{k.title}</span>
                    <span className="font-mono text-[10px] text-slate-400 block" dir="ltr">{k.url}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDockKeys(dockKeys.filter((_, i) => i !== idx));
                  }}
                  className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold text-xs cursor-pointer"
                >
                  ✕ حذف
                </button>
              </div>
            ))}
          </div>
        </div>
  `;

  adminSiteInfoContent = adminSiteInfoContent.replace(
    '<div className="flex gap-3 pt-4',
    dockUiSection + '\n<div className="flex gap-3 pt-4'
  );

  writeFile('components/AdminSiteInfo.tsx', adminSiteInfoContent);
}

// =============================================================================
// ۴. تست بیلد و پوش به گیت‌هاب
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(dock): full dynamic 3D contact dock management, realtime CDC & database sync"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سامانه داک ارتباطی پویا با موفقیت روی سرور لایو مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}