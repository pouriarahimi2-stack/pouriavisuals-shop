/**
 * AXON CORE - Upgrade Admin Sidebar with Full Navigation & Secure Logout (fix.js)
 * Ensures all hardened routes are represented with active path recognition.
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
  console.log(`\x1b[32m✔ ارتقا یافت: ${relPath}\x1b[0m`);
}

console.log("\x1b[35m[SIDEBAR-UPGRADE]\x1b[0m بازطراحی و ارتقای کامل سایدبار ناوبری ادمین...");

const sidebarPath = 'components/admin/AdminSidebar.tsx';

const upgradedSidebarCode = `"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", title: "داشبورد اصلی", href: "/admin/dashboard", icon: "⚡" },
  { id: "orders", title: "مدیریت سفارشات", href: "/admin/orders", icon: "📦" },
  { id: "products", title: "کاتالوگ محصولات", href: "/admin/products", icon: "💻" },
  { id: "coupons", title: "کدهای تخفیف", href: "/admin/coupons", icon: "🏷️" },
  { id: "banners", title: "بنرها و اسلایدر", href: "/admin/banners", icon: "🖼️" },
  { id: "news", title: "اخبار و مقالات", href: "/admin/news", icon: "📰" },
  { id: "reports", title: "گزارشات و انبار", href: "/admin/reports", icon: "📈" },
  { id: "audit-logs", title: "لاگ‌های امنیتی", href: "/admin/audit-logs", icon: "🛡️" },
  { id: "backup", title: "پشتیبان‌گیری داده‌ها", href: "/admin/backup", icon: "💾" },
  { id: "settings", title: "تنظیمات فروشگاه", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ادامه خروج حتی در صورت خطای شبکه
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <aside
      className="w-64 bg-[var(--modal-bg)] border-l border-[var(--card-border)] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans"
      dir="rtl"
    >
      {/* بخش لوگو و برند */}
      <div className="p-6 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--accent-blue)] to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
            A
          </div>
          <div>
            <h2 className="font-black text-sm text-[var(--text-primary)] tracking-wide">
              آکسون کور
            </h2>
            <span className="text-[10px] text-[var(--accent-blue)] font-bold block uppercase tracking-wider">
              Control Panel v1.0
            </span>
          </div>
        </div>
      </div>

      {/* منوی ناوبری اصلی */}
      <nav className="p-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => soundEngine.playClick()}
              className={\`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all \${
                isActive
                  ? "bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/20"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--input-bg)]"
              }\`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* بخش پایین سایدبار و دکمه خروج */}
      <div className="p-4 border-t border-[var(--card-border)] space-y-2">
        <Link
          href="/"
          target="_blank"
          onClick={() => soundEngine.playClick()}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-[var(--input-bg)] transition"
        >
          <span className="flex items-center gap-2">
            <span>🌐</span> مشاهده فروشگاه
          </span>
          <span className="text-xs font-mono">↗</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <span>🚪</span> خروج از مدیریت
        </button>
      </div>
    </aside>
  );
}
`;

writeFile(sidebarPath, upgradedSidebarCode);

// تست کامپایل پروژه
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال به مخزن گیت‌هاب
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(admin): modernize AdminSidebar with full navigation links and server-cleared session logout"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سایدبار ادمین با موفقیت روی سرور ورسل مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}