export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: SubCategory[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  category: string;
  subCategory?: string;
  image?: string;
  stock?: number;
  description?: string;
  isSpecial?: boolean;
}

const PRODUCTS_KEY = "site_products";
const CATEGORIES_KEY = "site_categories";

// دسته‌بندی‌های پیش‌فرض اولویه
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "موبایل و تبلت",
    subcategories: [
      { id: "sub-1-1", name: "گوشی آیفون" },
      { id: "sub-1-2", name: "گوشی سامسونگ" },
      { id: "sub-1-3", name: "تبلت" },
    ],
  },
  {
    id: "cat-2",
    name: "لپ‌تاپ و تجهیزات",
    subcategories: [
      { id: "sub-2-1", name: "لپ‌تاپ گیمینگ" },
      { id: "sub-2-2", name: "موس و کیبورد" },
    ],
  },
];

export const productService = {
  // دریافت محصولات
  getProducts: (): Product[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // ذخیره محصولات
  saveProducts: (products: Product[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  // افزودن محصول جدید
  addProduct: (product: Omit<Product, "id">): Product => {
    const products = productService.getProducts();
    const newProduct: Product = {
      ...product,
      id: "prod-" + Date.now(),
    };
    const updated = [newProduct, ...products];
    productService.saveProducts(updated);
    return newProduct;
  },

  // ویرایش محصول
  updateProduct: (id: string, updatedData: Partial<Product>) => {
    const products = productService.getProducts();
    const updated = products.map((p) => (p.id === id ? { ...p, ...updatedData } : p));
    productService.saveProducts(updated);
  },

  // حذف محصول
  deleteProduct: (id: string) => {
    const products = productService.getProducts();
    const updated = products.filter((p) => p.id !== id);
    productService.saveProducts(updated);
  },

  // 📂 مدیریت دسته‌بندی‌ها و زیردسته‌ها
  getCategories: (): Category[] => {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES;
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  },

  saveCategories: (categories: Category[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },
};