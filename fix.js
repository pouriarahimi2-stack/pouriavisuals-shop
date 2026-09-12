/**
 * AXON CORE - Hide Header, Footer, and Public Docks inside /admin Routes (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[ADMIN-CLEANUP]\x1b[0m پنهان‌سازی هدر، فوتر و داک‌های عمومی در پیشخوان مدیریت...");

// =============================================================================
// اصلاح LayoutShell جهت تفکیک دقیق مسیرهای ادمین از ویترین عمومی
// =============================================================================
const layoutShellCode = `"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import AIAssistantChat from "@/components/AIAssistantChat";
import CartDrawer from "@/components/CartDrawer";
import ThemeProvider from "@/components/ThemeProvider";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        {/* هدر فروشگاه فقط در صفحات عمومی نمایش داده می‌شود */}
        {!isAdminRoute && <Header />}

        {/* محتوای صفحات */}
        <main className="flex-1 w-full">{children}</main>

        {/* فوتر و داک‌های تعاملی فقط در صفحات عمومی لود می‌شوند */}
        {!isAdminRoute && (
          <>
            <Footer />
            <ContactDock />
            <AIAssistantChat />
            <CartDrawer />
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
`;
writeFile('components/LayoutShell.tsx', layoutShellCode);

// اگر LayoutWrapper هم در پروژه موجود باشد، آن را نیز به‌روزرسانی می‌کنیم
if (fs.existsSync(path.join(process.cwd(), 'components/LayoutWrapper.tsx'))) {
  const layoutWrapperCode = `"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactDock from "@/components/ContactDock";
import AIAssistantChat from "@/components/AIAssistantChat";
import CartDrawer from "@/components/CartDrawer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <main className="flex-1 w-full">{children}</main>
      {!isAdminRoute && (
        <>
          <Footer />
          <ContactDock />
          <AIAssistantChat />
          <CartDrawer />
        </>
      )}
    </>
  );
}
`;
  writeFile('components/LayoutWrapper.tsx', layoutWrapperCode);
}

// =============================================================================
// بیلد و ارسال به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد با موفقیت پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "style(admin): hide public header, footer, and docks inside /admin layout"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ هدر و فوتر عمومی با موفقیت از بخش ادمین حذف و دیپلوی شدند!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}