export interface SiteInfo {
  id?: string;
  site_name?: string;
  siteName?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  header_announcement?: string;
  headerAnnouncement?: string;
  footer_text?: string;
  footerText?: string;
  [key: string]: any;
}

const LOCAL_KEY = 'PV_SITE_INFO_CACHE_V2';
let memorySiteInfo: SiteInfo | null = null;

export const siteInfoService = {
  // خواندن لحظه‌ای با تاخیر صفر (اول از RAM، بعد LocalStorage، بعد سرور در پس‌زمینه)
  getSiteInfoSync(): SiteInfo {
    if (memorySiteInfo) return memorySiteInfo;
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(LOCAL_KEY);
        if (local) {
          memorySiteInfo = JSON.parse(local);
          return memorySiteInfo!;
        }
      } catch {}
    }
    return {
      id: 'default_info',
      site_name: '',
      siteName: '',
      tagline: '',
      description: '',
    };
  },

  async getSiteInfo(): Promise<SiteInfo> {
    const instantData = this.getSiteInfoSync();

    // همگام‌سازی نامحسوس در پس‌زمینه بدون ایجاد لگ
    if (typeof window !== 'undefined') {
      fetch('/api/site-info', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (json?.data) {
            const formatted = this.formatData(json.data);
            memorySiteInfo = formatted;
            localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
          }
        })
        .catch(() => {});
    }

    return instantData;
  },

  async get(): Promise<SiteInfo> {
    return this.getSiteInfo();
  },

  async getAll(): Promise<SiteInfo[]> {
    const info = await this.getSiteInfo();
    return [info];
  },

  // ذخیره فوری و آنی (Optimistic Update) در ۰ میلی‌ثانیه
  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo; error?: string }> {
    const formatted = this.formatData({
      ...this.getSiteInfoSync(),
      ...info,
    });

    // ۱. آپدیت آنی رم و مرورگر
    memorySiteInfo = formatted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
      // شلیک رویداد سراسری برای آپدیت آنی هدر، فوتر و سایر تب‌ها
      window.dispatchEvent(new CustomEvent('site_info_updated', { detail: formatted }));
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pv_site_sync');
        channel.postMessage({ type: 'SITE_INFO_CHANGE', data: formatted });
        channel.close();
      }
    }

    // ۲. ارسال نامحسوس به سرور دیتابیس در پس‌زمینه (Non-blocking)
    fetch('/api/site-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatted),
    }).catch(() => {});

    return { success: true, data: formatted };
  },

  async update(info: Partial<SiteInfo>) {
    return this.updateSiteInfo(info);
  },

  formatData(data: any): SiteInfo {
    if (!data) return {};
    return {
      ...data,
      siteName: data.site_name || data.siteName || '',
      tagline: data.tagline || '',
      logoUrl: data.logo_url || data.logoUrl || '',
      headerAnnouncement: data.header_announcement || data.headerAnnouncement || '',
      footerText: data.footer_text || data.footerText || '',
    };
  }
};

export default siteInfoService;