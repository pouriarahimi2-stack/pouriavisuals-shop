// File Path: lib/subAdminMonitor.ts
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";

export type MonitorEventType =
  | "login"
  | "logout"
  | "page_view"
  | "tab_switch"
  | "click_action"
  | "search_filter"
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
  os: string;
  browser: string;
  deviceType: string;
  screenResolution: string;
  userAgent: string;
  timestamp: string;
}

export interface SubAdminPresenceState {
  username: string;
  full_name: string;
  role: string;
  currentPath: string;
  currentSectionTitle: string;
  currentSubTab: string;
  lastActionDetails: string;
  lastEventType?: MonitorEventType;
  isLoggedOut?: boolean;
  ip: string;
  os: string;
  browser: string;
  deviceType: string;
  screenResolution: string;
  lastActiveAt: string;
  lastLoginAt?: string;
  totalLogins: number;
  totalPageViews: number;
  totalClicks: number;
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
  { match: "/admin/monitoring", key: "monitoring", title: "👁️‍🗨️ رادار نظارت زنده بر مدیران" },
  { match: "/admin/change-pin", key: "change_pin", title: "🔐 تغییر رمز و پین امنیتی" },
  { match: "/admin/audit-logs", key: "audit_logs", title: "🚨 لاگ‌های امنیتی" },
  { match: "/admin/backup", key: "backup", title: "💾 بکاپ و بازیابی دیتابیس" },
  { match: "/admin/settings", key: "settings", title: "⚙️ تنظیمات کلان و تعمیرات" },
  { match: "/api/products", key: "products", title: "🛍️ وب‌سرویس کاتالوگ محصولات" },
  { match: "/api/admin/products", key: "products", title: "🛍️ وب‌سرویس مدیریت محصولات" },
  { match: "/api/accounting", key: "inventory", title: "🏛️ وب‌سرویس حسابداری و انبار" },
  { match: "/api/admin/orders", key: "orders", title: "📦 وب‌سرویس مدیریت سفارشات" },
  { match: "/api/admin/coupons", key: "coupons", title: "🏷️ وب‌سرویس کدهای تخفیف" },
  { match: "/api/admin/banners", key: "banners", title: "🖼️ وب‌سرویس بنرها و اسلایدر" },
  { match: "/api/blogs", key: "blog", title: "📚 وب‌سرویس مقالات وبلاگ" },
  { match: "/api/news", key: "news", title: "📡 وب‌سرویس رادار اخبار" },
  { match: "/api/admin/seo-audit", key: "seo", title: "🚀 وب‌سرویس ممیزی سئو" },
  { match: "/api/theme-builder", key: "appearance", title: "🎨 وب‌سرویس استودیوی ظاهر" },
  { match: "/api/site-info", key: "settings", title: "⚙️ وب‌سرویس اطلاعات سایت" },
  { match: "/api/admin/settings", key: "settings", title: "⚙️ وب‌سرویس تنظیمات کلان" },
  { match: "/api/admin/backup", key: "backup", title: "💾 وب‌سرویس بکاپ دیتابیس" },
  { match: "/api/admin/users", key: "roles", title: "🛡️ وب‌سرویس مدیریت نقش‌ها" },
];

export function parseUserAgentDetails(uaRaw: string): {
  os: string;
  browser: string;
  deviceType: string;
} {
  const ua = String(uaRaw || "");
  let os = "نامشخص";
  if (/Windows NT 10|Windows NT 11/i.test(ua)) os = "Windows 10/11";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "مرورگر وب";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Google Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";

  let deviceType = "💻 دسکتاپ";
  if (/Mobile|Android|iPhone/i.test(ua)) deviceType = "📱 موبایل";
  else if (/iPad|Tablet/i.test(ua)) deviceType = "📟 تبلت";

  return { os, browser, deviceType };
}

export function resolveSectionFromPath(rawPath: string): { key: string; title: string } {
  const clean = String(rawPath || "").trim();
  const found = SECTION_LABELS_MAP.find((item) => clean.startsWith(item.match));
  if (found) return { key: found.key, title: found.title };
  if (clean.startsWith("/admin"))
    return { key: "dashboard", title: "📊 بخش مدیریت (" + clean + ")" };
  if (clean.startsWith("/api/"))
    return { key: "api", title: "⚙️ عملیات سیستمی (" + clean + ")" };
  return { key: "general", title: "🌐 پنل مدیریت" };
}

const memoryEventsBuffer: SubAdminActivityEvent[] = [];
const memoryPresenceMap: Record<string, SubAdminPresenceState> = {};

export async function recordSubAdminActivity(params: {
  username: string;
  full_name?: string;
  role: string;
  eventType: MonitorEventType;
  path: string;
  subTab?: string;
  method?: string;
  details?: string;
  ip?: string;
  screenResolution?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    // عدم ثبت فعالیت‌های خود مدیر ارشد کل سیستم (superadmin) در رادار نظارت زیرمجموعه‌ها
    if (
      String(params.role || "").toLowerCase() === "superadmin" ||
      String(params.username || "").trim().toLowerCase() === "admin"
    ) {
      return;
    }

    const uname = String(params.username || "").trim();
    if (!uname) return;
    const lowerKey = uname.toLowerCase();
    const nowIso = new Date().toISOString();
    const sec = resolveSectionFromPath(params.path);
    const uaInfo = parseUserAgentDetails(params.userAgent || "");

    const siteRow = await getMasterSiteInfoRow();
    const layoutCfg = siteRow?.homepage_layout_config || {};
    const existingMonitor = layoutCfg.subadmin_monitoring_ledger || {};
    const dbPresenceMap: Record<string, SubAdminPresenceState> = {
      ...(existingMonitor.presenceMap || {}),
    };

    const basePresence: SubAdminPresenceState = dbPresenceMap[lowerKey] ||
      memoryPresenceMap[lowerKey] || {
        username: uname,
        full_name: params.full_name || uname,
        role: params.role || "viewer_reporter",
        currentPath: params.path || "/admin/dashboard",
        currentSectionTitle: sec.title,
        currentSubTab: params.subTab || "نمای اصلی",
        lastActionDetails: params.details || sec.title,
        lastEventType: params.eventType,
        isLoggedOut: false,
        ip: params.ip || "127.0.0.1",
        os: uaInfo.os,
        browser: uaInfo.browser,
        deviceType: uaInfo.deviceType,
        screenResolution: params.screenResolution || "—",
        lastActiveAt: nowIso,
        totalLogins: 0,
        totalPageViews: 0,
        totalClicks: 0,
        totalActions: 0,
        totalBlocked: 0,
        sectionVisits: {},
      };

    const nextPresence: SubAdminPresenceState = {
      ...basePresence,
      username: uname,
      full_name: params.full_name || basePresence.full_name || uname,
      role: params.role || basePresence.role || "viewer_reporter",
      ip: params.ip || basePresence.ip || "127.0.0.1",
      os: uaInfo.os !== "نامشخص" ? uaInfo.os : basePresence.os || "نامشخص",
      browser:
        uaInfo.browser !== "مرورگر وب"
          ? uaInfo.browser
          : basePresence.browser || "مرورگر وب",
      deviceType: uaInfo.deviceType || basePresence.deviceType || "💻 دسکتاپ",
      screenResolution:
        params.screenResolution && params.screenResolution !== "—"
          ? params.screenResolution
          : basePresence.screenResolution || "—",
      lastEventType: params.eventType,
      isLoggedOut: params.eventType === "logout",
      lastActiveAt: nowIso,
    };

    if (params.eventType === "logout") {
      nextPresence.currentSectionTitle = "خارج شده از پنل";
      nextPresence.currentSubTab = "آفلاین";
      nextPresence.lastActionDetails = params.details || "🚪 خروج از پنل مدیریت";
    } else {
      if (params.path && params.path.startsWith("/admin")) {
        nextPresence.currentPath = params.path;
        nextPresence.currentSectionTitle = sec.title;
        if (params.eventType === "page_view" && !params.subTab) {
          nextPresence.currentSubTab = "نمای اصلی بخش";
        }
      }
      if (params.subTab) {
        nextPresence.currentSubTab = params.subTab;
      }
      if (params.details && params.eventType !== "heartbeat") {
        nextPresence.lastActionDetails = params.details;
      }
    }

    if (params.eventType === "login") {
      nextPresence.lastLoginAt = nowIso;
      nextPresence.isLoggedOut = false;
      nextPresence.totalLogins = Number(basePresence.totalLogins || 0) + 1;
    } else if (params.eventType === "page_view") {
      nextPresence.totalPageViews = Number(basePresence.totalPageViews || 0) + 1;
      nextPresence.sectionVisits = {
        ...(basePresence.sectionVisits || {}),
        [sec.title]: Number(basePresence.sectionVisits?.[sec.title] || 0) + 1,
      };
    } else if (
      params.eventType === "click_action" ||
      params.eventType === "tab_switch" ||
      params.eventType === "search_filter"
    ) {
      nextPresence.totalClicks = Number(basePresence.totalClicks || 0) + 1;
    } else if (params.eventType === "action_success") {
      nextPresence.totalActions = Number(basePresence.totalActions || 0) + 1;
    } else if (params.eventType === "action_blocked") {
      nextPresence.totalBlocked = Number(basePresence.totalBlocked || 0) + 1;
    }

    memoryPresenceMap[lowerKey] = nextPresence;
    dbPresenceMap[lowerKey] = nextPresence;

    let dbEvents: SubAdminActivityEvent[] = Array.isArray(existingMonitor.events)
      ? existingMonitor.events
      : [];

    if (params.eventType !== "heartbeat") {
      const newEvent: SubAdminActivityEvent = {
        id: "mon_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        username: uname,
        full_name: nextPresence.full_name,
        role: nextPresence.role,
        eventType: params.eventType,
        sectionKey: sec.key,
        sectionTitle: sec.title,
        path: params.path,
        method: params.method || "VIEW",
        details: params.details || sec.title,
        ip: nextPresence.ip,
        os: nextPresence.os,
        browser: nextPresence.browser,
        deviceType: nextPresence.deviceType,
        screenResolution: nextPresence.screenResolution,
        userAgent: String(params.userAgent || "").slice(0, 120),
        timestamp: nowIso,
      };
      memoryEventsBuffer.unshift(newEvent);
      if (memoryEventsBuffer.length > 350) memoryEventsBuffer.pop();
      dbEvents = [newEvent, ...dbEvents].slice(0, 350);
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

export async function clearSubAdminMonitoringLedger(resetCounters = false): Promise<void> {
  memoryEventsBuffer.length = 0;

  const siteRow = await getMasterSiteInfoRow();
  const layoutCfg = siteRow?.homepage_layout_config || {};
  const existingPresence: Record<string, SubAdminPresenceState> =
    layoutCfg.subadmin_monitoring_ledger?.presenceMap || {};

  const nextPresenceMap: Record<string, SubAdminPresenceState> = {};

  if (!resetCounters) {
    Object.assign(nextPresenceMap, existingPresence);
  } else {
    for (const k of Object.keys(memoryPresenceMap)) {
      delete memoryPresenceMap[k];
    }
  }

  await saveMasterSiteInfoRow(
    siteRow,
    {
      ...layoutCfg,
      subadmin_monitoring_ledger: {
        presenceMap: nextPresenceMap,
        events: [],
        updatedAt: new Date().toISOString(),
      },
    },
    {}
  );
}

export async function getSubAdminMonitoringSnapshot() {
  const siteRow = await getMasterSiteInfoRow();
  const layoutCfg = siteRow?.homepage_layout_config || {};
  const ledger = layoutCfg.subadmin_monitoring_ledger || {};

  const combinedPresenceMap: Record<string, SubAdminPresenceState> = {
    ...(ledger.presenceMap || {}),
  };
  for (const [k, v] of Object.entries(memoryPresenceMap)) {
    const dbEntry = combinedPresenceMap[k];
    if (!dbEntry) {
      combinedPresenceMap[k] = v;
    } else {
      const memTime = new Date(v.lastActiveAt || 0).getTime();
      const dbTime = new Date(dbEntry.lastActiveAt || 0).getTime();
      combinedPresenceMap[k] = memTime >= dbTime ? { ...dbEntry, ...v } : dbEntry;
    }
  }

  const eventsMap = new Map<string, SubAdminActivityEvent>();
  const ledgerEvents: SubAdminActivityEvent[] = Array.isArray(ledger.events)
    ? ledger.events
    : [];

  for (const ev of [...ledgerEvents, ...memoryEventsBuffer]) {
    if (ev?.id) eventsMap.set(ev.id, ev);
  }

  const events = Array.from(eventsMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 350);

  return {
    presenceMap: combinedPresenceMap,
    events,
  };
}