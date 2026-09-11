/**
 * AXON CORE - Phase 12: Centralized Secure Logger & Audit Trail (fix.js)
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

console.log("\x1b[36m[AXON-PHASE12]\x1b[0m پیاده‌سازی سیستم لاگینگ مرکزی و ممیزی امنیتی...");

// =============================================================================
// ۱. ایجاد ماژول مرکزی lib/logger.ts
// =============================================================================
const loggerModuleCode = `/**
 * AXON CORE - Centralized Structured Logger
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY" | "PAYMENT" | "AUDIT";

export const logger = {
  log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(meta ? { meta } : {}),
    };

    if (process.env.NODE_ENV === "production") {
      // در محیط پروداکشن می‌توان به سنسورهای مانیتورینگ مانند Sentry ارسال کرد
      if (level === "ERROR" || level === "SECURITY" || level === "PAYMENT") {
        console.error(JSON.stringify(payload));
      } else {
        console.log(JSON.stringify(payload));
      }
    } else {
      const color =
        level === "ERROR" ? "\\x1b[31m" :
        level === "SECURITY" ? "\\x1b[35m" :
        level === "PAYMENT" ? "\\x1b[32m" :
        level === "WARN" ? "\\x1b[33m" : "\\x1b[36m";

      console.log(\`\${color}[\${level}] \${timestamp}: \${message}\\x1b[0m\`, meta || "");
    }
  },

  info(msg: string, meta?: Record<string, any>) {
    this.log("INFO", msg, meta);
  },

  warn(msg: string, meta?: Record<string, any>) {
    this.log("WARN", msg, meta);
  },

  error(msg: string, meta?: Record<string, any>) {
    this.log("ERROR", msg, meta);
  },

  security(msg: string, meta?: Record<string, any>) {
    this.log("SECURITY", msg, meta);
  },

  payment(msg: string, meta?: Record<string, any>) {
    this.log("PAYMENT", msg, meta);
  },

  audit(msg: string, meta?: Record<string, any>) {
    this.log("AUDIT", msg, meta);
  },
};
`;
writeFile('lib/logger.ts', loggerModuleCode);

// =============================================================================
// ۲. بیلد نهایی پروژه و انتشار در Vercel
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
  execSync('git commit -m "feat(observability): implement centralized structured logger for security, payment and audit trails"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ لایه مانیتورینگ و لاگینگ با موفقیت در ورسل منتشر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}