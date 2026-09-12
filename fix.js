/**
 * AXON CORE - Fix applyTitleToDOM Arguments Signature (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ فایل بهینه‌سازی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[SIGNATURE-FIX]\x1b[0m ارتقای امضای تابع applyTitleToDOM برای پذیرش ۲ آرگومان...");

// =============================================================================
// بازنویسی lib/realtimeSync.ts با پشتیبانی از ۲ آرگومان برای applyTitleToDOM
// =============================================================================
const realtimeSyncCode = `import { supabase } from "./supabase";

const SAFE_PUBLIC_TABLES = [
  "products",
  "banners",
  "site_info",
  "categories",
  "posts",
  "tech_news"
];

let activeChannel: any = null;
let debounceTimer: NodeJS.Timeout | null = null;

export const realtimeEngine = {
  init() {
    if (typeof window === "undefined" || activeChannel) return () => {};

    const ch = supabase.channel("axon_public_updates");

    SAFE_PUBLIC_TABLES.forEach((tbl) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table: tbl }, (payload) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent(\`db_\${tbl}_updated\`, { detail: payload }));
        }, 200);
      });
    });

    ch.subscribe();
    activeChannel = ch;

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  },

  broadcastLocally(eventName: string, data: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
  }
};

/**
 * تنظیم عنوان صفحه بر اساس شعار و نام برند (پشتیبانی از ۱ یا ۲ آرگومان اختیاری)
 */
export function applyTitleToDOM(tagline?: string, siteName?: string) {
  if (typeof document !== "undefined") {
    if (tagline && siteName) {
      document.title = \`\${siteName} | \${tagline}\`;
    } else if (tagline || siteName) {
      document.title = tagline || siteName || "آکسون | Axon";
    }
  }
}

export function applyFaviconToDOM(iconUrl: string) {
  if (typeof document !== "undefined" && iconUrl) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "shortcut icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = iconUrl;
  }
}
`;
writeFile('lib/realtimeSync.ts', realtimeSyncCode);

// =============================================================================
// تست بیلد و ارسال نهایی به گیت‌هاب
// =============================================================================
console.log("بررسی کامپایل TypeScript و بیلد نهایی...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد بدون هیچ خطایی ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(types): update applyTitleToDOM signature to accept optional tagline and siteName parameters"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ نسخه نهایی و پایدار با موفقیت روی گیت‌هاب و ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}