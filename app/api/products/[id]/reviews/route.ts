// File Path: app/api/products/[id]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getMasterSiteInfoRow, saveMasterSiteInfoRow } from "@/lib/siteInfoPersistence";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const [r1, r2, siteRow] = await Promise.all([
      supabaseAdmin
        .from("reviews")
        .select("*")
        .eq("product_id", decodedId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("product_reviews")
        .select("*")
        .eq("product_id", decodedId)
        .order("created_at", { ascending: false }),
      getMasterSiteInfoRow(),
    ]);

    const layoutCfg = siteRow?.homepage_layout_config || {};
    const storedMetaList: any[] = Array.isArray(layoutCfg.reviews_metadata_store)
      ? layoutCfg.reviews_metadata_store.filter(
          (m: any) => String(m?.product_id) === String(decodedId)
        )
      : [];

    const combinedMap = new Map<string, any>();
    for (const item of [...(r1.data || []), ...(r2.data || []), ...storedMetaList]) {
      if (!item || !item.id) continue;
      combinedMap.set(String(item.id), {
        id: String(item.id),
        product_id: decodedId,
        user_name: item.user_name || item.author_name || "خریدار محصول",
        author_name: item.author_name || item.user_name || "خریدار محصول",
        rating: Number(item.rating || 5),
        comment: item.comment || item.content || "",
        admin_reply: item.admin_reply || "",
        is_approved: item.is_approved !== false && item.status !== "pending",
        created_at: item.created_at || new Date().toISOString(),
      });
    }

    const reviews = Array.from(combinedMap.values())
      .filter((r) => r.is_approved !== false && r.comment)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return NextResponse.json(
      { success: true, reviews },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, reviews: [], message: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = await req.json();
    const userName = String(body.user_name || body.author_name || "خریدار محصول").trim();
    const comment = String(body.comment || body.body || "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5));

    if (!userName || !comment) {
      return NextResponse.json(
        { success: false, message: "اطلاعات دیدگاه ناقص است." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const newReview = {
      id: randomUUID(),
      product_id: decodedId,
      user_name: userName,
      rating,
      comment,
      created_at: nowIso,
    };

    await Promise.all([
      supabaseAdmin.from("product_reviews").insert([newReview]),
      supabaseAdmin.from("reviews").insert([
        {
          ...newReview,
          is_approved: true,
          status: "approved",
          updated_at: nowIso,
        },
      ]),
    ]);

    try {
      const siteRow = await getMasterSiteInfoRow();
      const layoutCfg = siteRow?.homepage_layout_config || {};
      const list = Array.isArray(layoutCfg.reviews_metadata_store)
        ? layoutCfg.reviews_metadata_store
        : [];
      list.unshift({
        ...newReview,
        is_approved: true,
        status: "approved",
        admin_reply: "",
      });
      await saveMasterSiteInfoRow(
        siteRow,
        {
          ...layoutCfg,
          reviews_metadata_store: list.slice(0, 500),
        },
        {}
      );
    } catch {}

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "✓ دیدگاه شما با موفقیت ثبت شد.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}