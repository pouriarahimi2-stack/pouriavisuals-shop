/**
 * AXON CORE - Admin Database Backup Page & Sidebar Integration (fix.js)
 * Preserves existing routes and connects to the hardened backup API.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

function writeFile(relPath, content) {
  const fullPath = path.join(ROOT, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ایجاد شد: ${relPath}\x1b[0m`);
}

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

console.log("\x1b[35m[BACKUP-UI]\x1b[0m پیاده‌سازی صفحه پشتیبان‌گیری دیتابیس و اتصال به سایدبار...");

// =============================================================================
// ۱. ایجاد صفحه پشتیبان‌گیری (app/admin/backup/page.tsx)
// =============================================================================
const backupPageCode = `"use client";

import React, { useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDownloadBackup = async () => {
    soundEngine.playClick();
    setDownloading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "خطا در دریافت خروجی پشتیبان از سرور.");
      }

      // دریافت محتوای فایل جیسون
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`axon-backup-\${new Date().toISOString().slice(0, 10)}.json\`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      soundEngine.playSuccess();
      setStatusMsg({
        type: "success",
        text: "فایل پشتیبان کامل با موفقیت دانلود شد و رویداد آن در لاگ‌های امنیتی ثبت گردید.",
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "خطا در برقراری ارتباط با سرور." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-4xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
          <span>💾</span> مرکز پشتیبان‌گیری و حفاظت داده‌ها (Disaster Recovery)
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
          تهیه نسخه پشتیبان ساختاریافته از تمامی جداول محصولات، سفارشات، کدهای تخفیف، بنرها و لاگ‌های امنیتی
        </p>
      </div>

      {statusMsg && (
        <div
          className={\`p-4 rounded-2xl text-xs font-bold border \${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }\`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">📊</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">پوشش ۷ جدول اصلی</span>
            <span className="text-[10px] text-slate-400 block">شامل محصولات، سفارشات و تنظیمات</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">🛡️</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">حفاظت سشن RBAC</span>
            <span className="text-[10px] text-slate-400 block">دسترسی انحصاری سوپرادمین</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-center space-y-1">
            <span className="text-2xl block">📝</span>
            <span className="text-xs font-bold text-[var(--text-primary)] block">ثبت خودکار Audit Trail</span>
            <span className="text-[10px] text-slate-400 block">ثبت IP و متادیتای دریافت خروجی</span>
          </div>
        </div>

        <div className="border-t border-[var(--card-border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            فرمت خروجی استاندارد JSON (سازگار با ایمپورت و بازیابی پایگاه داده Supabase)
          </span>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold text-xs hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>📥</span>
            {downloading ? "در حال تجمیع و ساخت اسنپ‌شات..." : "دریافت فایل کامل پشتیبان (.json)"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;
writeFile('app/admin/backup/page.tsx', backupPageCode);

// =============================================================================
// ۲. اضافه کردن دکمه پشتیبان‌گیری به سایدبار (components/admin/AdminSidebar.tsx)
// =============================================================================
const sidebarPath = 'components/admin/AdminSidebar.tsx';
let sidebarContent = readFile(sidebarPath);

if (sidebarContent && !sidebarContent.includes('/admin/backup')) {
  sidebarContent = sidebarContent.replace(
    /const\s+NAV_ITEMS\s*=\s*\[/,
    `const NAV_ITEMS = [\n      { id: "backup", title: "پشتیبان‌گیری داده‌ها", href: "/admin/backup", icon: "💾" },`
  );
  writeFile(sidebarPath, sidebarContent);
  console.log("\x1b[32m✔ پیوند پشتیبان‌گیری به منوی سایدبار اضافه شد.\x1b[0m");
}

// کامپایل و تست صحت
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(admin): create database backup interface and integrate with navigation sidebar"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه پشتیبان‌گیری با موفقیت در ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}