/**
 * AXON CORE - Add create method to orderService & pass build (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ فایل اصلاح شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[HOTFIX]\x1b[0m افزودن متد create به سرویس orderService...");

const orderServiceCode = `export interface Order {
  id: string;
  orderNumber?: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  phone?: string;
  customer_phone?: string;
  postalCode?: string;
  postal_code?: string;
  address?: string;
  status?: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus?: "unpaid" | "successful" | "failed";
  payment_status?: string;
  totalAmount?: number;
  total_amount?: number;
  finalAmount?: number;
  final_amount?: number;
  discountAmount?: number;
  discount_amount?: number;
  couponCode?: string;
  coupon_code?: string;
  trackingCode?: string;
  tracking_code?: string;
  items?: any[];
  notes?: string;
  customer?: any;
  created_at?: string;
  createdAt?: string;
}

export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.orders || json.data || []).map(normalizeOrder);
    } catch (err) {
      console.error("[ORDER_SERVICE_GETALL_ERROR]:", err);
      return [];
    }
  },

  async getById(id: string | number): Promise<Order | null> {
    try {
      const cleanId = String(id).trim();
      const res = await fetch(\`/api/orders/track?query=\${encodeURIComponent(cleanId)}\`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json();
      const list = json.orders || json.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return normalizeOrder(list[0]);
      }
      return null;
    } catch (err) {
      console.error("[ORDER_SERVICE_GETBYID_ERROR]:", err);
      return null;
    }
  },

  async create(orderData: any): Promise<{ success: boolean; order?: Order; message?: string }> {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const json = await res.json();
      return {
        success: Boolean(json.success),
        order: json.order ? normalizeOrder(json.order) : undefined,
        message: json.message,
      };
    } catch (err: any) {
      console.error("[ORDER_SERVICE_CREATE_ERROR]:", err);
      return { success: false, message: err?.message || "خطا در برقراری ارتباط با سرور." };
    }
  },

  async updateStatus(id: string | number, status: Order["status"], trackingCode?: string): Promise<boolean> {
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, tracking_code: trackingCode }),
      });
      return res.ok;
    } catch (err) {
      console.error("[ORDER_SERVICE_UPDATE_ERROR]:", err);
      return false;
    }
  }
};

export function normalizeOrder(raw: any): Order {
  return {
    ...raw,
    orderNumber: raw.order_number || raw.orderNumber || raw.id,
    customerName: raw.customer_name || raw.customerName,
    totalAmount: raw.total_amount || raw.totalAmount,
    finalAmount: raw.final_amount || raw.finalAmount,
    trackingCode: raw.tracking_code || raw.trackingCode,
  };
}
`;
writeFile('services/orderService.ts', orderServiceCode);

// =============================================================================
// تست بیلد لوکال و پوش به مخزن گیت‌هاب
// =============================================================================
console.log("تست بیلد لوکال (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ کامپایل بیلد با موفقیت ۱۰۰٪ پاس شد!\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال کامیت به مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git diff --cached --quiet || git commit -m "fix(orders): add create method to orderService to support CheckoutModal"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ نسخه نهایی و پایدار با موفقیت روی گیت‌هاب ثبت و در ورسل مستقر شد!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}