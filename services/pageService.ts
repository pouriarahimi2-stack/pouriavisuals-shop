export interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'products' | 'banner' | 'text' | 'blogs';
  title?: string;
  subtitle?: string;
  content?: string;
  image?: string;
  link?: string;
  items?: any[];
  visible: boolean;
}

export interface SitePageData {
  id: string;
  slug: string;
  title: string;
  sections: PageSection[];
  is_published: boolean;
}

const LOCAL_PAGE_KEY = 'PV_PAGE_CACHE_';

export const pageService = {
  getPageSync(slug: string = 'home'): SitePageData | null {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(LOCAL_PAGE_KEY + slug);
        if (local) return JSON.parse(local);
      } catch {}
    }
    return null;
  },

  async getPage(slug: string = 'home'): Promise<SitePageData | null> {
    const local = this.getPageSync(slug);
    try {
      const res = await fetch(`/api/pages?slug=${slug}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_PAGE_KEY + slug, JSON.stringify(json.data));
        }
        return json.data;
      }
    } catch {}
    return local;
  },

  async savePage(pageData: SitePageData): Promise<{ success: boolean; data?: SitePageData }> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_PAGE_KEY + pageData.slug, JSON.stringify(pageData));
      window.dispatchEvent(new CustomEvent('page_structure_updated', { detail: pageData }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('page_builder_sync');
        bc.postMessage({ type: 'PAGE_UPDATED', data: pageData });
        bc.close();
      }
    }

    fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData),
    }).catch(() => {});

    return { success: true, data: pageData };
  }
};

export default pageService;