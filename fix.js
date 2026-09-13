/**
 * AXON CORE - Upgrade Admin Settings Management Page (fix.js)
 * Connects directly to secured GET/POST /api/admin/settings with audit tracking.
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

console.log("\x1b[35m[SETTINGS-UI-UPGRADE]\x1b[0m ارتقای رابط کاربری تنظیمات سراسری فروشگاه...");

const settingsPagePath = 'app/admin/settings/page.tsx';

const settingsPageCode = `"use client";

import React, { useEffect, useState } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface SiteSettings {
  id?: string;
  site_title: string;
  phone: string;
  address: string;
  instagram: string;
  telegram: string;
  footer_text: string;
  enamad_code: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: "Axon Core",
    phone: "",
    address: "",
    instagram: "",
    telegram: "",
    footer_text: "",
    enamad_code: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (res.ok && json.success && json.settings) {
          setSettings({
            id: json.settings.id,
            site_title: json.settings.site_title || "Axon Core",
            phone: json.settings.phone || "",
            address: json.settings.address || "",
            instagram: json.settings.instagram || "",
            telegram: json.settings.telegram || "",
            footer_text: json.settings.footer_text || "",
            enamad_code: json.settings.enamad_code || "",
          });
        }
      } catch {
        setStatusMsg({ type: "error", text: "خطا در برقراری ارتباط با سرور." });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        setStatusMsg({ type: "success", text: "تنظیمات با موفقیت در پایگاه داده ثبت و در لاگ سیستم ذخیره شد." });
        if (json.settings?.id) {
          setSettings((prev) => ({ ...prev, id: json.settings.id }));
        }
      } else {
        setStatusMsg({ type: "error", text: json.message || "خطا در ذخیره‌سازی تنظیمات." });
      }
    } catch {
      setStatusMsg({ type: "error", text: "خطا در ارسال اطلاعات به سرور." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-4xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
          <span>⚙️</span> تنظیمات سراسری فروشگاه و ویترین
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
          مدیریت اطلاعات عمومی، راه‌های ارتباطی مشتریان، توضیحات فوتر و اینماد
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

      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5"
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">در حال دریافت تنظیمات فعلی فروشگاه...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  نام تجاری و عنوان سایت:
                </label>
                <input
                  type="text"
                  required
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  شماره تماس پشتیبانی و فروشگاه:
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="021-xxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                آدرس فیزیکی دفتر مرکزی / فروشگاه:
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  شناسه صفحه اینستاگرام:
                </label>
                <input
                  type="text"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                  placeholder="@yourstore"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  کانال یا پشتیبانی تلگرام:
                </label>
                <input
                  type="text"
                  value={settings.telegram}
                  onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
                  placeholder="@yourchannel"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                کد رهگیری اینماد (Enamad Code):
              </label>
              <input
                type="text"
                value={settings.enamad_code}
                onChange={(e) => setSettings({ ...settings, enamad_code: e.target.value })}
                placeholder="کد تأیید یا اسکریپت نماد اعتماد الکترونیکی"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                متن پاورقی و کپی‌رایت فوتر:
              </label>
              <textarea
                rows={3}
                value={settings.footer_text}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] hover:opacity-90 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? "در حال ذخیره‌سازی و ثبت لاگ..." : "ذخیره تغییرات تنظیمات 💾"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
`;

writeFile(settingsPagePath, settingsPageCode);

// تست کامپایل
console.log("بررسی کامپایل پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

// ارسال تغییرات به مخزن
console.log("ارسال تغییرات به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "feat(admin): enhance site settings page with live API persistence and audit logging"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ صفحه تنظیمات سایت با موفقیت در ورسل مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}