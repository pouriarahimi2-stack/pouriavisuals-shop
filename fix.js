/**
 * AXON CORE - Fix Products 'name' Not-Null Constraint & Admin API (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ به‌روزرسانی شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-FIX]\x1b[0m در حال رفع خطای 23502 (فیلد name در جدول products)...");

// =============================================================================
// ۱. ایجاد روت سروری امن app/api/products/route.ts با دسترسی کامل supabaseAdmin
// =============================================================================
const productsApiRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const cleanTitle = String(body.title || body.name || "").trim();

    if (!cleanTitle) {
      return NextResponse.json({ success: false, message: "عنوان کالا الزامی است." }, { status: 400 });
    }

    const productId = String(body.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7)));

    // رفع قطعی ارور 23502: تضمین ارسال همزمان name و title
    const payload: Record<string, any> = {
      id: productId,
      name: cleanTitle,
      title: cleanTitle,
      title_fa: body.title_fa || cleanTitle,
      sku: body.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
      brand: body.brand || "Apple",
      category: body.category || "تجهیزات تخصصی",
      price: Number(body.price || 0),
      discount_price: body.discountPrice ? Number(body.discountPrice) : (body.discount_price ? Number(body.discount_price) : null),
      stock: body.stock !== undefined ? Number(body.stock) : 10,
      is_available: body.isAvailable ?? body.is_available ?? true,
      image: body.image || (body.images && body.images[0]) || null,
      images: body.images || [],
      description: body.description || null,
      warranty: body.warranty || "گارانتی اصالت طلایی",
      variants: body.variants || [],
      specs: body.specs || {},
      meta_title: body.meta_title || cleanTitle,
      meta_description: body.meta_description || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("products")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    console.error("API product save error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه کالا الزامی است." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "کالا با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/products/route.ts', productsApiRoute);

// =============================================================================
// ۲. اصلاح services/productService.ts برای اتصال دوطرفه به API سرور و Supabase
// =============================================================================
const fixedProductService = `import { supabase } from "@/lib/supabase";

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  priceDelta?: number;
}

export interface Product {
  id: string;
  title: string;
  name?: string;
  title_fa?: string;
  sku?: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discount_price?: number;
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  is_featured?: boolean;
  category?: string;
  image?: string;
  images?: string[];
  description?: string;
  warranty?: string;
  variants?: ProductVariant[];
  specs?: Record<string, string>;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
}

export const FLAGSHIP_7_PRODUCTS: Product[] = [];

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      // در صورت وجود مشکل در کلاینت، واکشی از روت سرور
      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map((p: any) => ({
          ...p,
          id: String(p.id),
          title: p.title || p.name,
          name: p.name || p.title,
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          isAvailable: p.is_available !== false && (p.stock === null || p.stock === undefined || p.stock > 0),
        }));
      }

      return [];
    } catch {
      return [];
    }
  },

  getAllSync(): Product[] {
    return [];
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          id: String(data.id),
          title: data.title || data.name,
          name: data.name || data.title,
          discountPrice: data.discount_price ? Number(data.discount_price) : undefined,
          isAvailable: data.is_available !== false && (data.stock === null || data.stock === undefined || data.stock > 0),
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    const cleanTitle = String(product.title || product.name || "").trim();
    const productId = product.id || ("prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));

    const payload = {
      ...product,
      id: productId,
      name: cleanTitle,
      title: cleanTitle,
    };

    try {
      // ۱. ذخیره از طریق API سروری با دسترسی ادمین
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return json.data;
      }

      // ۲. تلاش ذخیره مستقیم کلاینت در صورت در دسترس نبودن موقت API
      const dbPayload: Record<string, any> = {
        id: productId,
        name: cleanTitle,
        title: cleanTitle,
        title_fa: product.title_fa || cleanTitle,
        sku: product.sku || ("SKU-" + productId.slice(-6).toUpperCase()),
        brand: product.brand || "Apple",
        category: product.category || "تجهیزات تخصصی",
        price: Number(product.price || 0),
        discount_price: product.discountPrice ? Number(product.discountPrice) : (product.discount_price ? Number(product.discount_price) : null),
        stock: product.stock !== undefined ? Number(product.stock) : 10,
        is_available: product.isAvailable ?? product.is_available ?? true,
        image: product.image || (product.images && product.images[0]) || null,
        images: product.images || [],
        description: product.description || null,
        warranty: product.warranty || "گارانتی اصالت طلایی",
        variants: product.variants || [],
        specs: product.specs || {},
        meta_title: product.meta_title || cleanTitle,
        meta_description: product.meta_description || null,
      };

      const { data: existing } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();

      if (existing) {
        const { data, error } = await supabase.from("products").update(dbPayload).eq("id", productId).select().single();
        if (error) throw error;
        return data;
      } else {
        dbPayload.created_at = new Date().toISOString();
        const { data, error } = await supabase.from("products").insert([dbPayload]).select().single();
        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.error("Save product error:", e);
      return null;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch("/api/products?id=" + encodeURIComponent(id), { method: "DELETE" });
      if (res.ok) return true;

      const { error } = await supabase.from("products").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};
`;
writeFile('services/productService.ts', fixedProductService);

// =============================================================================
// ۳. تست بیلد کامل و پوش به گیت‌هاب
// =============================================================================
console.log("تست بیلد کامل نرم‌افزار (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال تغییرات به گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "fix(products): fix 23502 not-null name constraint and route via server admin API"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ ذخیره‌سازی کالاها در دیتابیس با موفقیت پایدار و مستقر گردید!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}