/**
 * AXON CORE - ISR Cache Tags & Revalidation Helpers
 */

export const CACHE_TAGS = {
  PRODUCTS: "products-cache",
  BLOGS: "blogs-cache",
  SITE_INFO: "site-info-cache",
  ORDERS: "orders-cache",
};

export const REVALIDATE_TIMES = {
  PRODUCTS: 60, // هر ۶۰ ثانیه
  BLOGS: 300,   // هر ۵ دقیقه
  SETTINGS: 3600, // هر ۱ ساعت
};
