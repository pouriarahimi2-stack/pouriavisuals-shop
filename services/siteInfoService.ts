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
let isFetching = false;

export const siteInfoService = {
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
      site_name: 'Axon | آکسون',
      siteName: 'Axon | آکسون',
      tagline: 'نماد مسیر انتقال فوق‌سریع داده‌ها',
      description: '',
    };
  },

  async getSiteInfo(): Promise<SiteInfo> {
    const instantData = this.getSiteInfoSync();

    // جلوگیری قطعی از لوپ بی‌نهایت با پرچم isFetching
    if (typeof window !== 'undefined' && !isFetching) {
      isFetching = true;
      fetch('/api/site-info', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          isFetching = false;
          if (json?.data) {
            const formatted = this.formatData(json.data);
            memorySiteInfo = formatted;
            localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
          }
        })
        .catch(() => {
          isFetching = false;
        });
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

  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo; error?: string }> {
    const formatted = this.formatData({
      ...this.getSiteInfoSync(),
      ...info,
    });

    memorySiteInfo = formatted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
      window.dispatchEvent(new CustomEvent('site_info_updated', { detail: formatted }));
    }

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