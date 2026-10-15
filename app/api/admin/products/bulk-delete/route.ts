import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { action, category } = await req.json();

    let query = supabaseAdmin.from("products").select("*").neq("id", "0");
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: productsToProcess, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!productsToProcess || productsToProcess.length === 0) {
      return NextResponse.json({ success: false, message: "محصولی با این مشخصات یافت نشد." });
    }

    const ids = productsToProcess.map(p => p.id);

    if (action === "hide") {
      const { error } = await supabaseAdmin.from("products").update({ is_available: false }).in("id", ids);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `تعداد ${ids.length} محصول با موفقیت از سایت مخفی شدند.` });
    } 
    
    if (action === "delete") {
      const pathsToDeleteByBucket: Record<string, string[]> = {};
      
      productsToProcess.forEach(p => {
        const allImages = [p.image, ...(p.images || [])].filter(Boolean);
        allImages.forEach(url => {
          try {
            if (url.includes("/storage/v1/object/public/")) {
              const parts = url.split("/storage/v1/object/public/")[1].split("/");
              const bucket = parts.shift();
              const filePath = parts.join("/");
              
              if (bucket && filePath) {
                if (!pathsToDeleteByBucket[bucket]) pathsToDeleteByBucket[bucket] = [];
                pathsToDeleteByBucket[bucket].push(filePath);
              }
            }
          } catch(e) {}
        });
      });

      for (const [bucket, paths] of Object.entries(pathsToDeleteByBucket)) {
         if (paths.length > 0) {
             await supabaseAdmin.storage.from(bucket).remove(paths);
         }
      }

      const { error } = await supabaseAdmin.from("products").delete().in("id", ids);
      if (error) throw error;
      
      return NextResponse.json({ 
        success: true, 
        message: `عملیات موفق! ${ids.length} محصول به همراه تمام عکس‌های فیزیکی آن‌ها از سرور حذف شدند.` 
      });
    }

    return NextResponse.json({ success: false, message: "عملیات نامعتبر است." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
