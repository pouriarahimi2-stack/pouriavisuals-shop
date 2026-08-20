import { supabase } from '@/lib/supabase';

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
  // دریافت اطلاعات سایت از جدول site_info
  async getSiteInfo(): Promise<SiteInfo> {
    try {
      const { data, error } = await supabase
        .from('site_info')
        .select('*')
        .eq('id', 'default_info')
        .maybeSingle();

      if (error || !data) {
        const { data: firstRow } = await supabase
          .from('site_info')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (firstRow) {
          const formatted = this.formatData(firstRow);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
          }
          return formatted;
        }
      }

      if (data) {
        const formatted = this.formatData(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch {
      // استفاده از کش در زمان نبود اینترنت
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

  // ذخیره دائمی مشخصات در دیتابیس Supabase
  async updateSiteInfo(info: Partial<SiteInfo>): Promise<{ success: boolean; data?: SiteInfo; error?: string }> {
    try {
      const payload: Record<string, any> = {
        id: 'default_info',
        site_name: info.site_name || info.siteName || '',
        tagline: info.tagline || '',
        logo_url: info.logo_url || info.logoUrl || null,
        phone: info.phone || null,
      };

      if (info.description !== undefined || info.about !== undefined) {
        payload.description = info.description || info.about || '';
      }
      if (info.email !== undefined) payload.email = info.email || null;
      if (info.address !== undefined) payload.address = info.address || null;
      if (info.instagram !== undefined) payload.instagram = info.instagram || null;
      if (info.telegram !== undefined) payload.telegram = info.telegram || null;
      if (info.whatsapp !== undefined) payload.whatsapp = info.whatsapp || null;

      const { data, error } = await supabase
        .from('site_info')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      const formatted = this.formatData(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
      }

      return { success: true, data: formatted };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطا در ذخیره اطلاعات سایت' };
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