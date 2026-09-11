/**
 * AXON CORE - Database Schema Audit Script
 */
import { supabaseAdmin } from "../lib/supabaseServer";

async function runAudit() {
  console.log("🔍 در حال بررسی اتصال به پایگاه داده Supabase...");
  
  const tables = ["products", "orders", "payments", "posts", "site_info", "contact_messages"];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.warn(`⚠️ جدول ${table} نیاز به بررسی دارد یا موجود نیست: `, error.message);
    } else {
      console.log(`✔ جدول __${table}___ با موفقیت پاسخ داد.`);
    }
  }
}

runAudit();
