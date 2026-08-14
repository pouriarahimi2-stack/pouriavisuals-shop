export interface MenuItem {
  id: string;
  label: string;
  href: string;
}

const STORAGE_KEY = "app_menu_items_db";

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: "1", label: "خانه", href: "/" },
  { id: "2", label: "محصولات", href: "/#products" },
  { id: "3", label: "پیگیری سفارش", href: "/track-order" },
];

export const menuService = {
  getMenuItems(): MenuItem[] {
    if (typeof window === "undefined") return DEFAULT_MENU_ITEMS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
        return DEFAULT_MENU_ITEMS;
      }
      return JSON.parse(saved);
    } catch {
      return DEFAULT_MENU_ITEMS;
    }
  },

  saveMenuItems(items: MenuItem[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  },

  addMenuItem(item: Omit<MenuItem, "id">): MenuItem {
    const items = this.getMenuItems();
    const newItem = { ...item, id: Date.now().toString() };
    const updated = [...items, newItem];
    this.saveMenuItems(updated);
    return newItem;
  },

  deleteMenuItem(id: string): MenuItem[] {
    const items = this.getMenuItems();
    const updated = items.filter((i) => i.id !== id);
    this.saveMenuItems(updated);
    return updated;
  },
};