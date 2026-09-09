/**
 * AXON CORE - Puck Front-End Live Rendering Integration (fix.js)
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

console.log("\x1b[36m[AXON-PUCK-RENDERER]\x1b[0m استقرار موتور رندر اختصاصی Puck برای صفحات لایو و لندینگ‌ها...");

// =============================================================================
// ۱. ارتقای components/modular/ModularPageRenderer.tsx به موتور بومی Render پکیج Puck
// =============================================================================
const modernPuckRenderer = `"use client";

import React, { useState, useEffect } from "react";
import { Render } from "@measured/puck";
import { puckConfig } from "@/lib/puckConfig";
import { supabase } from "@/lib/supabase";

interface Props {
  initialPage: any;
  slug: string;
}

export default function ModularPageRenderer({ initialPage, slug }: Props) {
  const [page, setPage] = useState<any>(initialPage);

  const fetchPage = async () => {
    try {
      const res = await fetch(\`/api/pages?slug=\${encodeURIComponent(slug)}\`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.page) {
        setPage(json.page);
      }
    } catch {}
  };

  useEffect(() => {
    const channel = supabase
      .channel(\`realtime-puck-render-\${slug}\`)
      .on("postgres_changes", { event: "*", schema: "public", table: "modular_pages" }, () => {
        fetchPage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (!page || !page.puck_data) {
    return null;
  }

  return (
    <div className="w-full min-h-screen font-sans select-none overflow-x-hidden" dir="rtl">
      <Render config={puckConfig} data={page.puck_data} />
    </div>
  );
}
`;
writeFile('components/modular/ModularPageRenderer.tsx', modernPuckRenderer);

// =============================================================================
// ۲. تست بیلد نهایی و ارسال به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد نهایی پروژه (npm run build)...");
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
  execSync('git commit -m "feat(puck-renderer): integrate native Puck <Render /> for lightning-fast public pages and realtime CDC updates"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ چرخه کامل Puck (از ویرایشگر ادمین تا رندر لایو سایت) مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}