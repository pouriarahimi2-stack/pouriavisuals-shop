export interface Category {
  id: string;
  name: string;
  slug: string;
}

const STORAGE_KEY = "app_categories_db";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "موبایل", slug: "mobile" },
  { id: "2", name: "لپ‌تاپ و کامپیوتر", slug: "laptop" },
  { id: "3", name: "لوازم جانبی", slug: "accessories" },
  { id: "4", name: "عمومی", slug: "general" },
];

export const categoryService = {
  getCategories(): Category[] {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(saved);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    }
  },

  addCategory(name: string): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      id: Date.now().toString(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };
    const updated = [...categories, newCat];
    this.saveCategories(updated);
    return newCat;
  },

  deleteCategory(id: string): Category[] {
    const categories = this.getCategories();
    const updated = categories.filter((c) => c.id !== id);
    this.saveCategories(updated);
    return updated;
  },
};