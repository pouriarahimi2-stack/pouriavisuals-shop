/**
 * AXON CORE - Force Sync & Direct Push Engine (fix.js)
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

console.log("\x1b[36m[AXON-PUSH]\x1b[0m اعمال فلیپ ۳D، چینش LTR و پنل مدیریت داک...");

// ۱. بازنویسی components/ContactDock.tsx
const contactDockComponent = `"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { siteInfoService } from "@/services/siteInfoService";
import { supabase } from "@/lib/supabase";

export interface DockKeyItem {
  id: string;
  letter: string;
  title: string;
  icon?: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", icon: "📞", url: "tel:09376110200" },
  { id: "k2", letter: "O", title: "رهگیری سفارشات", icon: "📦", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار استودیو", icon: "⚡", url: "/news" },
  { id: "k4", letter: "T", title: "پشتیبانی تلگرام", icon: "✈️", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره آکسون", icon: "🏢", url: "/about" },
  { id: "k6", letter: "C", title: "مشاوره آنلاین", icon: "💬", url: "/contact" },
  { id: "k7", letter: "T", title: "کاتالوگ محصولات", icon: "🛍️", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [flippedKeyId, setFlippedKeyId] = useState<string | null>(null);

  const loadDockSettings = async () => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("axon_contact_dock_keys_v2026");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setDockKeys(parsed);
        }
      }

      const info = await siteInfoService.getSiteInfo();
      if (info && (info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
        setDockKeys((info as any).contact_dock_items);
        if (typeof window !== "undefined") {
          localStorage.setItem("axon_contact_dock_keys_v2026", JSON.stringify((info as any).contact_dock_items));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      } else {
        loadDockSettings();
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    const channel = supabase
      .channel("realtime-dock-keys-footer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_info" }, () => {
        loadDockSettings();
      })
      .subscribe();

    return () => {
      window.removeEventListener("site_info_updated", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!dockKeys || dockKeys.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 font-sans select-none py-2" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">شبکه‌های ارتباطی و اجتماعی استودیو:</span>
      </div>

      <div
        className="p-2 sm:p-2.5 px-3 sm:px-4 rounded-full bg-slate-950/95 border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex items-center justify-center gap-1.5 sm:gap-2 relative"
        dir="ltr"
      >
        {dockKeys.map((k) => {
          const isFlipped = flippedKeyId === k.id;

          return (
            <div
              key={k.id}
              className="relative [perspective:1000px] w-9 h-9 sm:w-11 sm:h-11 cursor-pointer"
              onMouseEnter={() => {
                soundEngine.playClick();
                setFlippedKeyId(k.id);
              }}
              onMouseLeave={() => setFlippedKeyId(null)}
              onClick={() => {
                soundEngine.playClick();
                if (k.url) {
                  if (k.url.startsWith("http")) window.open(k.url, "_blank");
                  else window.location.href = k.url;
                }
              }}
            >
              <div
                className="w-full h-full relative transition-transform duration-500 ease-out [transform-style:preserve-3d] rounded-2xl"
                style={{
                  transform: isFlipped ? "rotateY(180deg) translateZ(8px)" : "rotateY(0deg)",
                }}
              >
                <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 text-white font-black text-xs sm:text-sm shadow-[0_5px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  {k.letter}
                </div>

                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black border border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.7)] p-0.5">
                  <span className="text-xs">{k.icon || "🔗"}</span>
                  <span className="text-[8px] font-bold truncate max-w-[34px] leading-tight text-center">
                    {k.letter}
                  </span>
                </div>
              </div>

              {isFlipped && (
                <div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700 text-white text-[10px] font-bold whitespace-nowrap shadow-2xl z-50 pointer-events-none animate-fadeIn"
                  dir="rtl"
                >
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

// ۲. بازنویسی components/AdminSiteInfo.tsx با پنل مدیریت داک
const adminSiteInfoComponent = `"use client";

import React, { useState, useEffect } from "react";
import { siteInfoService, MaintenanceMode } from "@/services/siteInfoService";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminSiteInfo() {
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [headerAnnouncement, setHeaderAnnouncement] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2000000);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>("none");

  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [youtube, setYoutube] = useState("");

  const [dockKeys, setDockKeys] = useState<Array<{ id: string; letter: string; title: string; icon?: string; url: string }>>([
    { id: "k1", letter: "C", title: "تماس تلفنی", icon: "📞", url: "tel:09376110200" },
    { id: "k2", letter: "O", title: "رهگیری سفارشات", icon: "📦", url: "/track-order" },
    { id: "k3", letter: "N", title: "اخبار استودیو", icon: "⚡", url: "/news" },
    { id: "k4", letter: "T", title: "پشتیبانی تلگرام", icon: "✈️", url: "https://t.me/axoncore" },
    { id: "k5", letter: "A", title: "درباره آکسون", icon: "🏢", url: "/about" },
    { id: "k6", letter: "C", title: "مشاوره آنلاین", icon: "💬", url: "/contact" },
    { id: "k7", letter: "T", title: "کاتالوگ محصولات", icon: "🛍️", url: "/products" },
  ]);

  const [newKeyLetter, setNewKeyLetter] = useState("");
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [newKeyIcon, setNewKeyIcon] = useState("🔗");
  const [newKeyUrl, setNewKeyUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    siteInfoService.getSiteInfo().then((data) => {
      if (data) {
        setSiteName(data.site_name || data.siteName || data.storeName || "");
        setTagline(data.tagline || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
        setWorkingHours(data.working_hours || "");
        setHeaderAnnouncement(data.header_announcement || "");
        setFreeShippingThreshold(Number(data.free_shipping_threshold || 2000000));
        setMaintenanceMode(data.maintenance_mode || "none");
        setLogoUrl(data.logo_url || data.logoUrl || "");
        setFooterLogoUrl(data.footer_logo_url || data.footerLogoUrl || "");
        setFaviconUrl(data.favicon_url || "");
        setInstagram(data.instagram || "");
        setTelegram(data.telegram || "");
        setWhatsapp(data.whatsapp || "");
        setYoutube(data.youtube || "");

        if ((data as any).contact_dock_items && Array.isArray((data as any).contact_dock_items)) {
          setDockKeys((data as any).contact_dock_items);
        }
      }
    });
  }, []);

  const handleAddKey = () => {
    if (!newKeyLetter.trim()) return;
    soundEngine.playClick();
    const newK = {
      id: "dock_" + Date.now(),
      letter: newKeyLetter.trim().toUpperCase().slice(0, 2),
      title: newKeyTitle.trim() || "پیوند استودیو",
      icon: newKeyIcon.trim() || "🔗",
      url: newKeyUrl.trim() || "#",
    };
    setDockKeys([...dockKeys, newK]);
    setNewKeyLetter("");
    setNewKeyTitle("");
    setNewKeyUrl("");
  };

  const handleRemoveKey = (index: number) => {
    soundEngine.playClick();
    setDockKeys(dockKeys.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSaving(true);
    setStatusMessage(null);

    const payload = {
      site_name: siteName,
      store_name: siteName,
      tagline,
      phone,
      email,
      address,
      working_hours: workingHours,
      header_announcement: headerAnnouncement,
      free_shipping_threshold: freeShippingThreshold,
      maintenance_mode: maintenanceMode,
      logo_url: logoUrl,
      footer_logo_url: footerLogoUrl,
      favicon_url: faviconUrl,
      instagram,
      telegram,
      whatsapp,
      youtube,
      contact_dock_items: dockKeys,
    };

    try {
      const res = await fetch("/api/site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("axon_contact_dock_keys_v2026", JSON.stringify(dockKeys));
        window.dispatchEvent(new CustomEvent("site_info_updated", { detail: payload }));
      }

      soundEngine.playSuccess();
      setStatusMessage({ type: "success", text: "✓ کلیه تنظیمات و کلیدهای داک با موفقیت در دیتابیس ذخیره و بلادرنگ اعمال شدند." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "خطا در ذخیره‌سازی تنظیمات." });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none text-[var(--text-primary)]" dir="rtl">
      <div className="bg-[var(--modal-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>⚙️</span> تنظیمات عمومی، هویت برند و کلیدهای داک ارتباطی
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            پیکربندی کلان سایت، اطلاعات تماس، لوگوهای انیمیشنی و شخصی‌سازی کامل داک ۳D
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-lg cursor-pointer disabled:opacity-50"
        >
          {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری"}
        </button>
      </div>

      {statusMessage && (
        <div className={"p-4 rounded-2xl text-xs font-bold transition animate-fadeIn " + (statusMessage.type === "success" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border border-rose-500/30")}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
                <span>🎛️</span>
                <span>مدیریت کلیدهای داک سه‌بعدی ارتباطی (3D Mechanical Dock)</span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                تغییر حروف، آیکون، عنوان نمایشی و پیوند مقصد با پیش‌نمایش چرخش سه‌بعدی
              </p>
            </div>
            <span className="font-mono font-bold text-xs bg-[var(--input-bg)] px-3 py-1 rounded-xl border border-[var(--card-border)]">
              {dockKeys.length} کلید فعال
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <span className="text-[10px] text-slate-400 font-bold block">پیش‌نمایش تعاملی (ماوس را روی کلیدها ببرید):</span>
            <div className="flex items-center justify-center gap-2" dir="ltr">
              {dockKeys.map((k) => (
                <div key={k.id} className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-black text-xs hover:scale-110 hover:border-blue-500 transition">
                  {k.letter}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">حرف کلید:</label>
              <input
                type="text"
                maxLength={2}
                placeholder="C"
                value={newKeyLetter}
                onChange={(e) => setNewKeyLetter(e.target.value.toUpperCase())}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-center text-xs uppercase outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">آیکون فلیپ:</label>
              <input
                type="text"
                placeholder="📞"
                value={newKeyIcon}
                onChange={(e) => setNewKeyIcon(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">عنوان راهنما (Tooltip):</label>
              <input
                type="text"
                placeholder="تماس تلفنی"
                value={newKeyTitle}
                onChange={(e) => setNewKeyTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">آدرس پیوند (URL):</label>
              <input
                type="text"
                placeholder="tel:0912... یا https://..."
                value={newKeyUrl}
                onChange={(e) => setNewKeyUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-xs outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddKey}
                className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shadow-md"
              >
                + افزودن کلید
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {dockKeys.map((k, idx) => (
              <div key={k.id || idx} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-white flex items-center justify-center font-black text-xs shadow-inner">
                    {k.letter}
                  </span>
                  <div>
                    <span className="font-bold text-xs block">{k.icon} {k.title}</span>
                    <span className="font-mono text-[10px] text-slate-400 block" dir="ltr">{k.url}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveKey(idx)}
                  className="p-1.5 px-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                >
                  🗑️ حذف
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm text-[var(--accent-blue)] border-b border-[var(--card-border)] pb-3">
            🏢 اطلاعات سازمانی و راه‌های ارتباطی
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">نام فروشگاه / برند</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs" />
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">شعار برند (Tagline)</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">شماره تلفن مستقیم پشتیبانی</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">پست الکترونیک رسمی (Email)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs" />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[var(--text-secondary)] mb-1">نشانی پستی انبار و تحویل حضوری</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl shadow-blue-500/25 cursor-pointer disabled:opacity-50"
          >
            {saving ? "در حال ذخیره‌سازی..." : "💾 ذخیره و انتشار سراسری در دیتابیس"}
          </button>
        </div>
      </form>
    </div>
  );
}
`;
writeFile('components/AdminSiteInfo.tsx', adminSiteInfoComponent);

// ۳. تست بیلد و ارسال قطعی به گیت‌هاب
console.log("تست بیلد کامل نرم‌افزار (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال قطعی تغییرات به گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(dock): complete 3D mechanical flip dock, fix LTR order and embed admin manager"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات با موفقیت Push شد و ورسل در حال دیپلوی است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}