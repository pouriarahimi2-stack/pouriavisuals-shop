/**
 * AXON CORE - Precision Interactive Pop-up Dock matching Video Animation (fix.js)
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

console.log("\x1b[36m[AXON-DOCK]\x1b[0m پیاده‌سازی دقیق انیمیشن پاپ‌آپ و مدیریت کامل داک...");

// =============================================================================
// ۱. بازنویسی components/ContactDock.tsx دقیقاً مطابق انیمیشن و فیزیک ویدیو
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
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  url: string;
}

const DEFAULT_DOCK_KEYS: DockKeyItem[] = [
  { id: "k1", letter: "C", title: "تماس تلفنی", subtitle: "پشتیبانی فوری", icon: "📞", accentColor: "#0071e3", url: "tel:09376110200" },
  { id: "k2", letter: "O", title: "سفارش‌ها", subtitle: "رهگیری پیشتاز", icon: "📦", accentColor: "#6366f1", url: "/track-order" },
  { id: "k3", letter: "N", title: "اخبار فناوری", subtitle: "رادار جهانی", icon: "⚡", accentColor: "#a855f7", url: "/news" },
  { id: "k4", letter: "T", title: "تلگرام استودیو", subtitle: "ارتباط مستقیم", icon: "✈️", accentColor: "#0ea5e9", url: "https://t.me/axoncore" },
  { id: "k5", letter: "A", title: "درباره آکسون", subtitle: "اصالت و تعهدات", icon: "🏢", accentColor: "#10b981", url: "/about" },
  { id: "k6", letter: "C", title: "تیکت مشاوره", subtitle: "پاسخ آنلاین", icon: "💬", accentColor: "#f59e0b", url: "/contact" },
  { id: "k7", letter: "T", title: "کاتالوگ کالا", subtitle: "تجهیزات ۵K", icon: "🛍️", accentColor: "#ec4899", url: "/products" },
];

export default function ContactDock() {
  const [dockKeys, setDockKeys] = useState<DockKeyItem[]>(DEFAULT_DOCK_KEYS);
  const [headerTitle, setHeaderTitle] = useState("شبکه‌های ارتباطی و اجتماعی استودیو:");
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);

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
      if (info) {
        if ((info as any).contact_dock_title) {
          setHeaderTitle((info as any).contact_dock_title);
        }
        if ((info as any).contact_dock_items && Array.isArray((info as any).contact_dock_items) && (info as any).contact_dock_items.length > 0) {
          setDockKeys((info as any).contact_dock_items);
          if (typeof window !== "undefined") {
            localStorage.setItem("axon_contact_dock_keys_v2026", JSON.stringify((info as any).contact_dock_items));
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadDockSettings();

    const handleUpdate = (e: any) => {
      if (e.detail?.contact_dock_items && Array.isArray(e.detail.contact_dock_items)) {
        setDockKeys(e.detail.contact_dock_items);
      }
      if (e.detail?.contact_dock_title) {
        setHeaderTitle(e.detail.contact_dock_title);
      }
    };
    window.addEventListener("site_info_updated", handleUpdate);

    const channel = supabase
      .channel("realtime-dock-keys-popup")
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
    <div className="flex flex-col items-center justify-center space-y-4 font-sans select-none py-6 overflow-visible" dir="rtl">
      
      {/* عنوان بالای داک با نشانگر نئونی پالس‌دار */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)] shadow-[0_0_12px_var(--accent-blue)] animate-pulse" />
        <span className="text-xs font-black text-[var(--text-primary)]">
          {headerTitle}
        </span>
      </div>

      {/* محفظه کپسولی تیره با استایل دقیق شبیه ویدیو و ترتیب LTR */}
      <div
        className="p-3 sm:p-3.5 px-4 sm:px-6 rounded-full bg-[#0b0f19]/95 border border-slate-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center justify-center gap-2 sm:gap-3 relative overflow-visible"
        dir="ltr"
      >
        {dockKeys.map((k) => {
          const isActive = activeKeyId === k.id;
          const accent = k.accentColor || "#0071e3";

          return (
            <div
              key={k.id}
              className="relative flex flex-col items-center overflow-visible"
              onMouseEnter={() => {
                soundEngine.playClick();
                setActiveKeyId(k.id);
              }}
              onMouseLeave={() => setActiveKeyId(null)}
              onClick={() => {
                soundEngine.playClick();
                if (k.url) {
                  if (k.url.startsWith("http")) window.open(k.url, "_blank");
                  else window.location.href = k.url;
                }
              }}
            >
              {/* پاپ‌آپ کارتی شناور بالا (دقیقاً مطابق رفتار ویدیو) */}
              <div
                className={\`absolute -top-20 pointer-events-none transition-all duration-300 ease-out z-50 flex flex-col items-center \${
                  isActive
                    ? "opacity-100 -translate-y-2 scale-100"
                    : "opacity-0 translate-y-2 scale-90"
                }\`}
                dir="rtl"
              >
                <div
                  className="px-3.5 py-2 rounded-2xl bg-[#0f172a]/95 border text-white shadow-2xl backdrop-blur-xl flex items-center gap-2 whitespace-nowrap"
                  style={{
                    borderColor: accent,
                    boxShadow: isActive ? \`0 10px 25px -5px \${accent}40\` : "none",
                  }}
                >
                  <span className="text-base">{k.icon || "🔗"}</span>
                  <div className="flex flex-col text-right">
                    <span className="font-black text-xs text-white leading-tight">{k.title}</span>
                    {k.subtitle && (
                      <span className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{k.subtitle}</span>
                    )}
                  </div>
                </div>

                {/* فلش یا مثلث پایین پاپ‌آپ */}
                <div
                  className="w-2.5 h-2.5 -mt-1 rotate-45 bg-[#0f172a] border-r border-b"
                  style={{ borderColor: accent }}
                />
              </div>

              {/* کلید مکانیکی با افکت جهش به بالا و روشن شدن نئونی هنگام هاور */}
              <button
                type="button"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base text-white transition-all duration-300 cursor-pointer relative group"
                style={{
                  backgroundColor: isActive ? "#1e293b" : "#111827",
                  borderWidth: "1.5px",
                  borderColor: isActive ? accent : "#1f2937",
                  transform: isActive ? "translateY(-6px) scale(1.08)" : "translateY(0) scale(1)",
                  boxShadow: isActive
                    ? \`0 12px 25px -5px \${accent}60, inset 0 1px 1px rgba(255,255,255,0.3)\`
                    : "0 6px 12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="transition-colors duration-300"
                  style={{ color: isActive ? accent : "#f3f4f6" }}
                >
                  {k.letter}
                </span>

                {/* خط نورانی باریک زیر دکمه فعال */}
                {isActive && (
                  <span
                    className="absolute bottom-1 w-2.5 h-0.5 rounded-full"
                    style={{ backgroundColor: accent, boxShadow: \`0 0 8px \${accent}\` }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-400 font-medium">
        برای مشاهده امکانات، ماوس را روی کلیدها ببرید یا کلیک کنید
      </span>
    </div>
  );
}
`;
writeFile('components/ContactDock.tsx', contactDockComponent);

// =============================================================================
// ۲. به‌روزرسانی پنل ادمین components/AdminSiteInfo.tsx برای کنترل کامل جزئیات
// =============================================================================
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

  // جزئیات داک و پاپ‌آپ
  const [dockTitle, setDockTitle] = useState("شبکه‌های ارتباطی و اجتماعی استودیو:");
  const [dockKeys, setDockKeys] = useState<Array<{
    id: string;
    letter: string;
    title: string;
    subtitle?: string;
    icon?: string;
    accentColor?: string;
    url: string;
  }>>([
    { id: "k1", letter: "C", title: "تماس تلفنی", subtitle: "پشتیبانی فوری", icon: "📞", accentColor: "#0071e3", url: "tel:09376110200" },
    { id: "k2", letter: "O", title: "سفارش‌ها", subtitle: "رهگیری پیشتاز", icon: "📦", accentColor: "#6366f1", url: "/track-order" },
    { id: "k3", letter: "N", title: "اخبار استودیو", subtitle: "رادار جهانی", icon: "⚡", accentColor: "#a855f7", url: "/news" },
    { id: "k4", letter: "T", title: "تلگرام استودیو", subtitle: "ارتباط مستقیم", icon: "✈️", accentColor: "#0ea5e9", url: "https://t.me/axoncore" },
    { id: "k5", letter: "A", title: "درباره آکسون", subtitle: "اصالت و تعهدات", icon: "🏢", accentColor: "#10b981", url: "/about" },
    { id: "k6", letter: "C", title: "مشاوره آنلاین", subtitle: "پاسخ سریع", icon: "💬", accentColor: "#f59e0b", url: "/contact" },
    { id: "k7", letter: "T", title: "کاتالوگ کالا", subtitle: "تجهیزات ۵K", icon: "🛍️", accentColor: "#ec4899", url: "/products" },
  ]);

  const [newKeyLetter, setNewKeyLetter] = useState("");
  const [newKeyTitle, setNewKeyTitle] = useState("");
  const [newKeySubtitle, setNewKeySubtitle] = useState("");
  const [newKeyIcon, setNewKeyIcon] = useState("🔗");
  const [newKeyColor, setNewKeyColor] = useState("#0071e3");
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

        if ((data as any).contact_dock_title) {
          setDockTitle((data as any).contact_dock_title);
        }
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
      title: newKeyTitle.trim() || "پیوند",
      subtitle: newKeySubtitle.trim() || undefined,
      icon: newKeyIcon.trim() || "🔗",
      accentColor: newKeyColor || "#0071e3",
      url: newKeyUrl.trim() || "#",
    };
    setDockKeys([...dockKeys, newK]);
    setNewKeyLetter("");
    setNewKeyTitle("");
    setNewKeySubtitle("");
    setNewKeyUrl("");
  };

  const handleRemoveKey = (index: number) => {
    soundEngine.playClick();
    setDockKeys(dockKeys.filter((_, i) => i !== index));
  };

  const handleMoveKey = (index: number, direction: "left" | "right") => {
    soundEngine.playClick();
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dockKeys.length) return;
    const updated = [...dockKeys];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setDockKeys(updated);
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
      contact_dock_title: dockTitle,
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
      setStatusMessage({ type: "success", text: "✓ تمامی تنظیمات داک و اطلاعات سایت با موفقیت در دیتابیس ذخیره و بلادرنگ اعمال شدند." });
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
            <span>⚙️</span> پیکربندی عمومی و مدیریت پاپ‌آپ داک استودیو
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            شخصی‌سازی پاپ‌آپ‌ها، رنگ نئون هر کلید، تنظیم پیوندها و به‌روزرسانی بلادرنگ
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
        
        {/* پنل اختصاصی مدیریت داک تعاملی */}
        <div className="p-6 md:p-8 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-4">
            <div>
              <h3 className="font-black text-sm text-[var(--accent-blue)] flex items-center gap-2">
                <span>🎛️</span>
                <span>مدیریت کامل داک پاپ‌آپ استودیو (Interactive Pop-up Dock)</span>
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                تغییر عنوان بالای داک، حروف، آیکون، رنگ اختصاصی نئون و ترتیب کلیدها
              </p>
            </div>
            <span className="font-mono font-bold text-xs bg-[var(--input-bg)] px-3 py-1 rounded-xl border border-[var(--card-border)]">
              {dockKeys.length} کلید فعال
            </span>
          </div>

          <div>
            <label className="block mb-1 font-bold text-[var(--text-secondary)]">عنوان متن بالای داک در فوتر:</label>
            <input
              type="text"
              value={dockTitle}
              onChange={(e) => setDockTitle(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          {/* پیش‌نمایش زنده در داخل ادمین */}
          <div className="p-5 rounded-3xl bg-[#0b0f19] border border-slate-800 text-center space-y-3">
            <span className="text-[10px] text-slate-400 font-bold block">پیش‌نمایش تعاملی (ماوس را روی هر کلید ببرید تا پاپ‌آپ اختصاصی باز شود):</span>
            <div className="flex items-center justify-center gap-2.5" dir="ltr">
              {dockKeys.map((k) => (
                <div
                  key={k.id}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 border flex items-center justify-center font-black text-xs text-white transition hover:-translate-y-1"
                  style={{ borderColor: k.accentColor || "#334155" }}
                  title={\`\${k.title} (\${k.url})\`}
                >
                  {k.letter}
                </div>
              ))}
            </div>
          </div>

          {/* فرم افزودن کلید جدید */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--card-border)]">
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
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">آیکون پاپ‌آپ:</label>
              <input
                type="text"
                placeholder="📞"
                value={newKeyIcon}
                onChange={(e) => setNewKeyIcon(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-center text-xs outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">عنوان اصلی:</label>
              <input
                type="text"
                placeholder="تماس تلفنی"
                value={newKeyTitle}
                onChange={(e) => setNewKeyTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold text-xs outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">زیرعنوان پاپ‌آپ:</label>
              <input
                type="text"
                placeholder="پشتیبانی فوری"
                value={newKeySubtitle}
                onChange={(e) => setNewKeySubtitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">رنگ نئون:</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={newKeyColor}
                  onChange={(e) => setNewKeyColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border-none bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="#0071e3"
                  value={newKeyColor}
                  onChange={(e) => setNewKeyColor(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-[10px] text-[var(--text-secondary)]">لینک مقصد (URL):</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="https://..."
                  value={newKeyUrl}
                  onChange={(e) => setNewKeyUrl(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono text-[10px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKey}
                  className="px-3 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition cursor-pointer shrink-0"
                  title="افزودن کلید"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* لیست کلیدهای ثبت‌شده همراه با تغییر چیدمان و حذف */}
          <div className="space-y-2">
            {dockKeys.map((k, idx) => (
              <div key={k.id || idx} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md"
                    style={{ backgroundColor: "#1e293b", border: \`1.5px solid \${k.accentColor || "#38bdf8"}\` }}
                  >
                    {k.letter}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{k.icon} {k.title}</span>
                      {k.subtitle && <span className="text-[10px] text-[var(--text-secondary)]">({k.subtitle})</span>}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 block" dir="ltr">{k.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveKey(idx, "left")}
                    disabled={idx === 0}
                    className="p-1.5 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer font-mono"
                    title="جابجایی به چپ"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveKey(idx, "right")}
                    disabled={idx === dockKeys.length - 1}
                    className="p-1.5 px-2 rounded-lg bg-[var(--modal-bg)] border border-[var(--card-border)] disabled:opacity-30 cursor-pointer font-mono"
                    title="جابجایی به راست"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveKey(idx)}
                    className="p-1.5 px-2.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                    title="حذف کلید"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* اطلاعات تماس سازمانی */}
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

// =============================================================================
// ۳. تست بیلد و ارسال قطعی به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد کامل نرم‌افزار (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال قطعی تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(dock): precision pop-up card animation matching video & comprehensive admin dock controller"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تغییرات با موفقیت به گیت‌هاب ارسال شد و ورسل در حال استقرار نسخه جدید است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}