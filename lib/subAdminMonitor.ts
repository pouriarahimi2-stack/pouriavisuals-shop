// File Path: lib/subAdminMonitor.ts
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export type MonitorEventType =
  | "login"
  | "logout"
  | "page_view"
  | "heartbeat"
  | "action_success"
  | "action_blocked";

export interface SubAdminActivityEvent {
  id: string;
  username: string;
  full_name: string;
  role: string;
  eventType: MonitorEventType;
  sectionKey: string;
  sectionTitle: string;
  path: string;
  method?: string;
  details: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

export interface SubAdminPresenceState {
  username: string;
  full_name: string;
  role: string;
  currentPath: string;
  currentSectionTitle: string;
  ip: string;
  lastActiveAt: string;
  lastLoginAt?: string;
  totalLogins: number;
  totalPageViews: number;
  totalActions: number;
  totalBlocked: number;
  sectionVisits: Record<string, number>;
}

const SECTION_LABELS_MAP: Array<{ match: string; key: string; title: string }> = [
  { match: "/admin/dashboard", key: "dashboard", title: "📊 داشبورد تحلیلی و فرماندهی" },
  { match: "/admin/inventory", key: "inventory", title: "🏛️ حسابداری، انبار و سفارشات" },
  { match: "/admin/orders", key: "orders", title: "📦 مدیریت سفارشات و بارنامه" },
  { match: "/admin/financial", key: "financial", title: "💳 امور مالی و حسابداری" },
  { match: "/admin/reports", key: "reports", title: "📈 گزارش‌های مالی و گردش ماهانه" },
  { match: "/admin/products", key: "products", title: "🛍️ کاتالوگ محصولات و قیمت‌ها" },
  { match: "/admin/banners", key: "banners", title: "🖼️ بنرها و اسلایدر محصولات" },
  { match: "/admin/customers", key: "customers", title: "👥 مشتریان (CRM) و پیامک" },
  { match: "/admin/coupons", key: "coupons", title: "🏷️ کدهای تخفیف زمان‌دار" },
  { match: "/admin/appearance", key: "appearance", title: "🎨 استودیوی ظاهر، هدر و فوتر" },
  { match: "/admin/menu", key: "menu", title: "🧭 منوها و دسته‌بندی‌ها" },
  { match: "/admin/pages", key: "pages", title: "⚡ صفحه‌ساز ماژولار" },
  { match: "/admin/styles", key: "styles", title: "✨ هویت بصری، فونت‌ها و CSS" },
  { match: "/admin/seo", key: "seo", title: "🚀 دستیار تخصصی سئو" },
  { match: "/admin/blog", key: "blog", title: "📚 وبلاگ و مقالات سئو" },
  { match: "/admin/news", key: "news", title: "📡 رادار اخبار فناوری" },
  { match: "/admin/ai", key: "ai", title: "🤖 مرکز هوش مصنوعی و کوپایلوت" },
  { match: "/admin/messages", key: "messages", title: "📩 تیکت‌ها و پیام‌های کاربران" },
  { match: "/admin/reviews", key: "reviews", title: "⭐ دیدگاه‌ها و نظرات" },
  { match: "/admin/roles", key: "roles", title: "🛡️ مدیران و ماتریس دسترسی‌ها" },
  { match: "/admin/monitoring", key: "monitoring", title: "👁️‍🗨️ رادار نظارت بر مدیران" },
  { match: "/admin/change-pin", key: "change_pin", title: "🔐 تغییر رمز و پین امنیتی" },
  { match: "/admin/audit-logs", key: "audit_logs", title: "🚨 لاگ‌های امنیتی" },
  { match: "/admin/backup", key: "backup", title: "💾 بکاپ و بازیابی دیتابیس" },
  { match: "/admin/settings", key: "settings", title: "⚙️ تنظیمات کلان و تعمیرات" },
  { match: "/api/products", key: "products", title: "🛍️ API کاتالوگ محصولات" },
  { match: "/api/admin/products", key: "products", title: "🛍️ API مدیریت محصولات" },
  { match: "/api/accounting", key: "inventory", title: "🏛️ API حسابداری و انبار" },
  { match: "/api/admin/orders", key: "orders", title: "📦 API مدیریت سفارشات" },
  { match: "/api/admin/coupons", key: "coupons", title: "🏷️ API کدهای تخفیف" },
  { match: "/api/admin/banners", key: "banners", title: "🖼️ API بنرها و اسلایدر" },
  { match: "/api/blogs", key: "blog", title: "📚 API مقالات وبلاگ" },
  { match: "/api/news", key: "news", title: "📡 API رادار اخبار" },
  { match: "/api/admin/seo-audit", key: "seo", title: "🚀 API ممیزی و بهینه‌سازی سئو" },
  { match: "/api/theme-builder", key: "appearance", title: "🎨 API استودیوی ظاهر" },
  { match: "/api/site-info", key: "settings", title: "⚙️ API اطلاعات و تنظیمات سایت" },
  { match: "/api/admin/settings", key: "settings", title: "⚙️ API تنظیمات کلان" },
  { match: "/api/admin/backup", key: "backup", title: "💾 API بکاپ دیتابیس" },
  { match: "/api/admin/users", key: "roles", title: "🛡️ API مدیریت نقش‌ها" },
];

export function resolveSectionFromPath(rawPath: string): { key: string; title: string } {
  const clean = String(rawPath || "").trim();
  const found = SECTION_LABELS_MAP.find((item) => clean.startsWith(item.match));
  if (found) return { key: found.key, title: found.title };
  if (clean.startsWith("/admin")) return { key: "dashboard", title: "📊 بخش مدیریت (" + clean + ")" };
  if (clean.startsWith("/api/")) return { key: "api", title: "⚙️ عملیات سیستمی (" + clean + ")" };
  return { key: "general", title: "🌐 پنل مدیریت" };
}

// کش حافظه سرور برای پاسخ‌دهی فوری در کنار ذخیره‌سازی پایدار در دیتابیس
const memoryEventsBuffer: SubAdminActivityEvent[] = [];
const memoryPresenceMap: Record<string, SubAdminPresenceState> = {};

export async function recordSubAdminActivity(params: {
  username: string;
  full_name?: string;
  role: string;
  eventType: MonitorEventType;
  path: string;
  method?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const uname = String(params.username || "admin").trim();
    const lowerKey = uname.toLowerCase();
    const nowIso = new Date().toISOString();
    const sec = resolveSectionFromPath(params.path);

    const prevPresence: SubAdminPresenceState = memoryPresenceMap[lowerKey] || {
      username: uname,
      full_name: params.full_name || uname,
      role: params.role || "viewer_reporter",
      currentPath: params.path || "/admin/dashboard",
      currentSectionTitle: sec.title,
      ip: params.ip || "127.0.0.1",
      lastActiveAt: nowIso,
      totalLogins: 0,
      totalPageViews: 0,
      totalActions: 0,
      totalBlocked: 0,
      sectionVisits: {},
    };

    prevPresence.username = uname;
    if (params.full_name) prevPresence.full_name = params.full_name;
    if (params.role) prevPresence.role = params.role;
    if (params.ip) prevPresence.ip = params.ip;
    prevPresence.lastActiveAt = nowIso;

    if (params.path && params.path.startsWith("/admin")) {
      prevPresence.currentPath = params.path;
      prevPresence.currentSectionTitle = sec.title;
    }

    if (params.eventType === "login") {
      prevPresence.lastLoginAt = nowIso;
      prevPresence.totalLogins = Number(prevPresence.totalLogins || 0) + 1;
    } else if (params.eventType === "page_view") {
      prevPresence.totalPageViews = Number(prevPresence.totalPageViews || 0) + 1;
      prevPresence.sectionVisits = {
        ...(prevPresence.sectionVisits || {}),
        [sec.title]: Number(prevPresence.sectionVisits?.[sec.title] || 0) + 1,
      };
    } else if (params.eventType === "action_success") {
      prevPresence.totalActions = Number(prevPresence.totalActions || 0) + 1;
    } else if (params.eventType === "action_blocked") {
      prevPresence.totalBlocked = Number(prevPresence.totalBlocked || 0) + 1;
    }

    memoryPresenceMap[lowerKey] = prevPresence;

    // رویداد heartbeat فقط وضعیت آنلاین را تازه می‌کند و لاگ تکراری در جدول نمی‌اندازد
    let newEvent: SubAdminActivityEvent | null = null;
    if (params.eventType !== "heartbeat") {
      newEvent = {
        id: "mon_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        username: uname,
        full_name: prevPresence.full_name,
        role: prevPresence.role,
        eventType: params.eventType,
        sectionKey: sec.key,
        sectionTitle: sec.title,
        path: params.path,
        method: params.method || "GET",
        details: params.details || sec.title,
        ip: params.ip || "127.0.0.1",
        userAgent: String(params.userAgent || "").slice(0, 120),
        timestamp: nowIso,
      };
      memoryEventsBuffer.unshift(newEvent);
      if (memoryEventsBuffer.length > 350) memoryEventsBuffer.pop();
    }

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const existingMonitor = layoutCfg.subadmin_monitoring_ledger || {};
    const dbPresenceMap: Record<string, SubAdminPresenceState> = {
      ...(existingMonitor.presenceMap || {}),
    };

    const existingUserPresence = dbPresenceMap[lowerKey];
    if (existingUserPresence) {
      dbPresenceMap[lowerKey] = {
        ...existingUserPresence,
        ...prevPresence,
        totalLogins:
          Math.max(Number(existingUserPresence.totalLogins || 0), prevPresence.totalLogins - 1) +
          (params.eventType === "login" ? 1 : 0),
        totalPageViews:
          Math.max(
            Number(existingUserPresence.totalPageViews || 0),
            prevPresence.totalPageViews - 1
          ) + (params.eventType === "page_view" ? 1 : 0),
        totalActions:
          Math.max(Number(existingUserPresence.totalActions || 0), prevPresence.totalActions - 1) +
          (params.eventType === "action_success" ? 1 : 0),
        totalBlocked:
          Math.max(Number(existingUserPresence.totalBlocked || 0), prevPresence.totalBlocked - 1) +
          (params.eventType === "action_blocked" ? 1 : 0),
        sectionVisits: {
          ...(existingUserPresence.sectionVisits || {}),
          ...(params.eventType === "page_view"
            ? {
                [sec.title]:
                  Number(existingUserPresence.sectionVisits?.[sec.title] || 0) + 1,
              }
            : {}),
        },
      };
      memoryPresenceMap[lowerKey] = dbPresenceMap[lowerKey];
    } else {
      dbPresenceMap[lowerKey] = prevPresence;
    }

    let dbEvents: SubAdminActivityEvent[] = Array.isArray(existingMonitor.events)
      ? existingMonitor.events
      : [];
    if (newEvent) {
      dbEvents = [newEvent, ...dbEvents].slice(0, 300);
    }

    await saveMasterSiteInfoRow(
      siteRow,
      {
        ...layoutCfg,
        subadmin_monitoring_ledger: {
          presenceMap: dbPresenceMap,
          events: dbEvents,
          updatedAt: nowIso,
        },
      },
      {}
    );
  } catch {}
}

export async function getSubAdminMonitoringSnapshot() {
  const siteRow = await getMasterSiteInfoRow();
  const layoutCfg = siteRow?.homepage_layout_config || {};
  const ledger = layoutCfg.subadmin_monitoring_ledger || {};

  const combinedPresenceMap: Record<string, SubAdminPresenceState> = {
    ...(ledger.presenceMap || {}),
  };
  for (const [k, v] of Object.entries(memoryPresenceMap)) {
    combinedPresenceMap[k] = {
      ...(combinedPresenceMap[k] || {}),
      ...v,
    };
  }

  const eventsMap = new Map<string, SubAdminActivityEvent>();
  [...memoryEventsBuffer, ...(Array.isArray(ledger.events) ? ledger.events : [])].forEach((ev) => {
    if (ev?.id) eventsMap.set(ev.id, ev);
  });

  const events = Array.from(eventsMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 300);

  return {
    presenceMap: combinedPresenceMap,
    events,
  };
}
