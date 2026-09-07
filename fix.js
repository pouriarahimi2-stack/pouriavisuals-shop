/**
 * AXON CORE - Safe Schema Sync & Production Push (fix.js)
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

console.log("\x1b[36m[AXON-DEPLOY]\x1b[0m استقرار سرویس استاندارد دسته‌بندی با حفظ کامل امنیت داده‌ها...");

const secureCategoryService = `import { supabase } from "@/lib/supabase";

export interface Category {
  id?: string;
  name: string;
  slug: string;
  order?: number;
  created_at?: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async addCategory(cat: { name: string; slug?: string }): Promise<Category | null> {
    try {
      const cleanName = cat.name.trim();
      const cleanSlug = (cat.slug || cleanName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\\u0600-\\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        name: cleanName,
        slug: cleanSlug,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Database insert category error:", error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error("Add category error:", e);
      return null;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  },
};
`;
writeFile('services/categoryService.ts', secureCategoryService);

console.log("تست بیلد نهایی پروژه (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت کامل پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطا در بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال و استقرار روی مخزن گیت‌هاب...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(categories): secure schema sync with auto-generated slug support"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ تمامی تغییرات با موفقیت روی سرور لایو مستقر شدند.\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}