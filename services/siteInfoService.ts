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

export const siteInfoService = {
  async getSiteInfo(): Promise<SiteInfo> {
    try {
      const res = await fetch('/api/site-info', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const formatted = this.formatData(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
          }
          return formatted;
        }
      }
    } catch {
      // استفاده از کش
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) return JSON.parse(local);
    }

    return {
      id: 'default_info',
      site_name: '',
      siteName: '',
      tagline: '',
      description: '',
    };
  },

  async get(): Promise<SiteInfo> {
    return this.getSiteInfo();
  },

  async getAll(): Promise<SiteInfo[]> {
    const info = await this.getSiteInfo();
    return [info];
  },

  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo; error?: string }> {
    try {
      const res = await fetch('/api/site-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.message || 'خطا در ذخیره سازی' };
      }

      const formatted = this.formatData(json.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
      }

      return { success: true, data: formatted };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطای شبکه' };
    }
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