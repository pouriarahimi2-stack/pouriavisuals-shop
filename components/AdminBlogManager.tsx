// File Path: components/AdminBlogManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";
import MediaUploadModal from "@/components/admin/MediaUploadModal";

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string;
  author?: string;
  image_url?: string;
  meta_description?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CatalogProductItem {
  id: string;
  title: string;
  category: string;
  brand: string;
  price: number;
  image: string;
  warranty: string;
  specs?: Record<string, any>;
}

interface TableRowBlock {
  label: string;
  value: string;
}

interface FaqItemBlock {
  question: string;
  answer: string;
}

interface StructuredArticleBlocks {
  introHeading: string;
  introBody: string;
  whyHeading: string;
  whyBody: string;
  tableHeading: string;
  tableCol1Header: string;
  tableCol2Header: string;
  tableRows: TableRowBlock[];
  faqHeading: string;
  faqItems: FaqItemBlock[];
  inArticleCtaEnabled: boolean;
  inArticleCtaTitle: string;
  inArticleCtaText: string;
  inArticleCtaButtonText: string;
  inArticleCtaUrl: string;
}

function stripTags(html: string): string {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseArticleHtmlToBlocks(html: string): StructuredArticleBlocks {
  const raw = String(html || "");

  // 1. استخراج H2 اول و پاراگراف مقدمه
  const h2Match = raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const introHeading = h2Match ? stripTags(h2Match[1]) : "";

  const h3Matches = Array.from(raw.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi));
  const firstH3Pos = h3Matches[0]?.index ?? raw.length;
  const introSlice = raw.slice(
    h2Match ? (h2Match.index || 0) + h2Match[0].length : 0,
    firstH3Pos
  );
  const introParas = Array.from(introSlice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
  const introBody = introParas.join("\n\n");

  // 2. استخراج H3 اول و متن معرفی / ارزش خرید
  const whyHeading = h3Matches[0] ? stripTags(h3Matches[0][1]) : "";
  const secondH3Pos = h3Matches[1]?.index ?? raw.length;
  const whySlice = h3Matches[0]
    ? raw.slice((h3Matches[0].index || 0) + h3Matches[0][0].length, secondH3Pos)
    : "";
  const whyParas = Array.from(whySlice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
  const whyListItems = Array.from(whySlice.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((m) => "• " + stripTags(m[1]))
    .filter(Boolean);
  const whyBody = [...whyParas, ...whyListItems].join("\n\n");

  // 3. استخراج جدول مشخصات
  const tableH3 = h3Matches.find((m) => /جدول|مشخصات|مقایسه/.test(m[1])) || h3Matches[1];
  const tableHeading = tableH3 ? stripTags(tableH3[1]) : "جدول مشخصات کلیدی";
  const tableMatch = raw.match(/<table[\s\S]*?<\/table>/i);
  let tableCol1Header = "شاخص بررسی";
  let tableCol2Header = "مشخصات در فروشگاه آکسون کور";
  const tableRows: TableRowBlock[] = [];

  if (tableMatch) {
    const thMatches = Array.from(
      tableMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)
    );
    if (thMatches[0]) tableCol1Header = stripTags(thMatches[0][1]) || tableCol1Header;
    if (thMatches[1]) tableCol2Header = stripTags(thMatches[1][1]) || tableCol2Header;

    const trMatches = Array.from(
      tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
    );
    for (const tr of trMatches) {
      const tds = Array.from(tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      if (tds.length >= 2) {
        tableRows.push({
          label: stripTags(tds[0][1]),
          value: stripTags(tds[1][1]),
        });
      }
    }
  }

  // 4. استخراج سوالات متداول (FAQ)
  const faqH3 = h3Matches.find((m) => /سوال|پرسش|متداول|FAQ/i.test(m[1]));
  const faqHeading = faqH3
    ? stripTags(faqH3[1])
    : "سوالات متداول پیش از خرید";
  const faqItems: FaqItemBlock[] = [];

  if (faqH3) {
    const afterFaq = raw.slice((faqH3.index || 0) + faqH3[0].length);
    const stopIdx = afterFaq.search(/<h[23]|<div[^>]*style=/i);
    const faqZone = stopIdx >= 0 ? afterFaq.slice(0, stopIdx) : afterFaq;
    const faqPs = Array.from(faqZone.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
    for (const fp of faqPs) {
      const strongMatch = fp[1].match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      if (strongMatch) {
        const qText = stripTags(strongMatch[1]);
        const restHtml = fp[1]
          .replace(strongMatch[0], "")
          .replace(/^(\s*<br\s*\/?>\s*)+/i, "");
        const aText = stripTags(restHtml);
        if (qText || aText) {
          faqItems.push({ question: qText, answer: aText });
        }
      }
    }
  }

  // 5. استخراج باکس خرید داخل مقاله
  const ctaDivMatch = raw.match(/<div[^>]*style="[^"]*gradient[^"]*"[\s\S]*?<\/div>/i);
  const prodAnchorMatch = raw.match(
    /<a[^>]*href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i
  );

  let inArticleCtaEnabled = Boolean(ctaDivMatch || prodAnchorMatch);
  let inArticleCtaTitle = "";
  let inArticleCtaText = "";
  let inArticleCtaButtonText = "خرید مستقیم محصول ←";
  let inArticleCtaUrl = prodAnchorMatch ? prodAnchorMatch[1] : "/products";

  if (ctaDivMatch) {
    const h4m = ctaDivMatch[0].match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    const pm = ctaDivMatch[0].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const am = ctaDivMatch[0].match(
      /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (h4m) inArticleCtaTitle = stripTags(h4m[1]);
    if (pm) inArticleCtaText = stripTags(pm[1]);
    if (am) {
      inArticleCtaUrl = am[1];
      inArticleCtaButtonText = stripTags(am[2]);
    }
  } else if (prodAnchorMatch) {
    inArticleCtaButtonText = stripTags(prodAnchorMatch[2]);
  }

  return {
    introHeading,
    introBody,
    whyHeading,
    whyBody,
    tableHeading,
    tableCol1Header,
    tableCol2Header,
    tableRows,
    faqHeading,
    faqItems,
    inArticleCtaEnabled,
    inArticleCtaTitle,
    inArticleCtaText,
    inArticleCtaButtonText,
    inArticleCtaUrl,
  };
}

function serializeBlocksToArticleHtml(blocks: StructuredArticleBlocks): string {
  const parts: string[] = ['<article class="space-y-6 leading-relaxed">'];

  if (blocks.introHeading.trim()) {
    parts.push(`  <h2>${blocks.introHeading.trim()}</h2>`);
  }
  if (blocks.introBody.trim()) {
    blocks.introBody
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        parts.push(`  <p>${p.replace(/\n/g, "<br/>")}</p>`);
      });
  }

  if (blocks.whyHeading.trim()) {
    parts.push(`  <h3>${blocks.whyHeading.trim()}</h3>`);
  }
  if (blocks.whyBody.trim()) {
    blocks.whyBody
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        parts.push(`  <p>${p.replace(/\n/g, "<br/>")}</p>`);
      });
  }

  const validRows = blocks.tableRows.filter(
    (r) => r.label.trim() || r.value.trim()
  );
  if (blocks.tableHeading.trim() || validRows.length > 0) {
    if (blocks.tableHeading.trim()) {
      parts.push(`  <h3>${blocks.tableHeading.trim()}</h3>`);
    }
    if (validRows.length > 0) {
      const rowsHtml = validRows
        .map(
          (r) =>
            `        <tr><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);font-weight:bold;">${r.label}</td><td style="padding:10px;border:1px solid rgba(148,163,184,0.2);">${r.value}</td></tr>`
        )
        .join("\n");

      parts.push(
        `  <div style="overflow-x:auto;margin:16px 0;">\n    <table style="width:100%;border-collapse:collapse;font-size:13px;">\n      <thead>\n        <tr style="background:rgba(2,132,199,0.12);">\n          <th style="padding:12px;border:1px solid rgba(148,163,184,0.25);text-align:right;">${
          blocks.tableCol1Header || "شاخص بررسی"
        }</th>\n          <th style="padding:12px;border:1px solid rgba(148,163,184,0.25);text-align:right;">${
          blocks.tableCol2Header || "مشخصات"
        }</th>\n        </tr>\n      </thead>\n      <tbody>\n${rowsHtml}\n      </tbody>\n    </table>\n  </div>`
      );
    }
  }

  const validFaqs = blocks.faqItems.filter(
    (f) => f.question.trim() || f.answer.trim()
  );
  if (blocks.faqHeading.trim() || validFaqs.length > 0) {
    if (blocks.faqHeading.trim()) {
      parts.push(`  <h3>${blocks.faqHeading.trim()}</h3>`);
    }
    validFaqs.forEach((f) => {
      parts.push(
        `  <p><strong>${f.question}</strong><br/>${f.answer.replace(
          /\n/g,
          "<br/>"
        )}</p>`
      );
    });
  }

  if (
    blocks.inArticleCtaEnabled &&
    (blocks.inArticleCtaTitle.trim() ||
      blocks.inArticleCtaText.trim() ||
      blocks.inArticleCtaButtonText.trim())
  ) {
    parts.push(
      `  <div style="margin-top:24px;padding:20px;border-radius:20px;background:linear-gradient(135deg,rgba(2,132,199,0.15),rgba(79,70,229,0.12));border:1px solid rgba(56,189,248,0.35);">\n    ${
        blocks.inArticleCtaTitle.trim()
          ? `<h4 style="margin:0 0 8px 0;font-weight:900;color:#38bdf8;">${blocks.inArticleCtaTitle.trim()}</h4>`
          : ""
      }\n    ${
        blocks.inArticleCtaText.trim()
          ? `<p style="margin:0 0 14px 0;font-size:13px;">${blocks.inArticleCtaText.trim()}</p>`
          : ""
      }\n    ${
        blocks.inArticleCtaButtonText.trim()
          ? `<a href="${
              blocks.inArticleCtaUrl.trim() || "/products"
            }" style="display:inline-block;padding:10px 22px;border-radius:14px;background:#0284c7;color:#ffffff;font-weight:900;text-decoration:none;font-size:13px;">${blocks.inArticleCtaButtonText.trim()}</a>`
          : ""
      }\n  </div>`
    );
  }

  parts.push("</article>");
  return parts.join("\n\n");
}

export function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // تب ویرایشگر: visual | html | preview
  const [editorMode, setEditorMode] = useState<"visual" | "html" | "preview">(
    "visual"
  );
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // تنظیمات سراسری تمام اجزای صفحه مقاله
  const [showBreadcrumb, setShowBreadcrumb] = useState(true);
  const [breadcrumbHomeLabel, setBreadcrumbHomeLabel] = useState("خانه");
  const [breadcrumbBlogLabel, setBreadcrumbBlogLabel] = useState("مجله تخصصی");
  const [showReadingTime, setShowReadingTime] = useState(true);
  const [readingTimePrefix, setReadingTimePrefix] = useState("زمان مطالعه:");
  const [readingTimeUnit, setReadingTimeUnit] = useState("دقیقه");
  const [showAuthor, setShowAuthor] = useState(true);
  const [authorPrefix, setAuthorPrefix] = useState("نویسنده:");
  const [defaultAuthorName, setDefaultAuthorName] = useState("");
  const [showPublishDate, setShowPublishDate] = useState(true);
  const [publishDatePrefix, setPublishDatePrefix] = useState("تاریخ انتشار:");
  const [showFeaturedImage, setShowFeaturedImage] = useState(true);

  const [showLinkedProductCard, setShowLinkedProductCard] = useState(true);
  const [linkedProductBadge, setLinkedProductBadge] = useState(
    "🛍️ محصول بررسی‌شده در این مقاله"
  );
  const [linkedProductButtonText, setLinkedProductButtonText] = useState(
    "مشاهده مشخصات و خرید آنلاین ←"
  );
  const [defaultWarrantyFallback, setDefaultWarrantyFallback] = useState("");

  const [showRelatedPosts, setShowRelatedPosts] = useState(true);
  const [relatedPostsTitle, setRelatedPostsTitle] = useState(
    "📚 سایر مقالات و راهنماهای تخصصی مرتبط"
  );
  const [relatedPostLinkText, setRelatedPostLinkText] =
    useState("مطالعه مقاله ←");

  const [ctaBoxEnabled, setCtaBoxEnabled] = useState(true);
  const [ctaBoxTitle, setCtaBoxTitle] = useState(
    "نیاز به مشاوره تخصصی جهت خرید محصولات دارید؟"
  );
  const [ctaBoxSubtitle, setCtaBoxSubtitle] = useState(
    "کارشناسان آکسون کور آماده پاسخگویی و راهنمایی تخصصی شما برای انتخاب بهترین کالا هستند."
  );
  const [ctaButtonText, setCtaButtonText] = useState(
    "مشاهده کاتالوگ محصولات ←"
  );
  const [ctaButtonUrl, setCtaButtonUrl] = useState("/products");
  const [archiveButtonText, setArchiveButtonText] = useState("آرشیو مجله");
  const [archiveButtonUrl, setArchiveButtonUrl] = useState("/blog");

  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("راهنمای خرید و بررسی تخصصی");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // استیت بلوک‌های بصری مقاله
  const [blocks, setBlocks] = useState<StructuredArticleBlocks>(() =>
    parseArticleHtmlToBlocks("")
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const notify = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const updateBlocksAndSyncHtml = (
    updater: (prev: StructuredArticleBlocks) => StructuredArticleBlocks
  ) => {
    setBlocks((prev) => {
      const next = updater(prev);
      setContent(serializeBlocksToArticleHtml(next));
      return next;
    });
  };

  const fetchPostsAndProducts = useCallback(async () => {
    try {
      const [postsRes, prodsRes] = await Promise.all([
        fetch("/api/blogs?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
        fetch("/api/products?t=" + Date.now(), { cache: "no-store" }).catch(() => null),
      ]);

      if (postsRes && postsRes.ok) {
        const bJson = await postsRes.json();
        const list = bJson.posts || bJson.data || [];
        setPosts(Array.isArray(list) ? list : []);

        const bCfg = bJson.blogPageConfig;
        if (bCfg && typeof bCfg === "object") {
          if (bCfg.showBreadcrumb !== undefined)
            setShowBreadcrumb(Boolean(bCfg.showBreadcrumb));
          if (bCfg.breadcrumbHomeLabel !== undefined)
            setBreadcrumbHomeLabel(String(bCfg.breadcrumbHomeLabel));
          if (bCfg.breadcrumbBlogLabel !== undefined)
            setBreadcrumbBlogLabel(String(bCfg.breadcrumbBlogLabel));
          if (bCfg.showReadingTime !== undefined)
            setShowReadingTime(Boolean(bCfg.showReadingTime));
          if (bCfg.readingTimePrefix !== undefined)
            setReadingTimePrefix(String(bCfg.readingTimePrefix));
          if (bCfg.readingTimeUnit !== undefined)
            setReadingTimeUnit(String(bCfg.readingTimeUnit));
          if (bCfg.showAuthor !== undefined)
            setShowAuthor(Boolean(bCfg.showAuthor));
          if (bCfg.authorPrefix !== undefined)
            setAuthorPrefix(String(bCfg.authorPrefix));
          if (bCfg.defaultAuthorName !== undefined)
            setDefaultAuthorName(String(bCfg.defaultAuthorName));
          if (bCfg.showPublishDate !== undefined)
            setShowPublishDate(Boolean(bCfg.showPublishDate));
          if (bCfg.publishDatePrefix !== undefined)
            setPublishDatePrefix(String(bCfg.publishDatePrefix));
          if (bCfg.showFeaturedImage !== undefined)
            setShowFeaturedImage(Boolean(bCfg.showFeaturedImage));

          if (bCfg.showLinkedProductCard !== undefined)
            setShowLinkedProductCard(Boolean(bCfg.showLinkedProductCard));
          if (bCfg.linkedProductBadge !== undefined)
            setLinkedProductBadge(String(bCfg.linkedProductBadge));
          if (bCfg.linkedProductButtonText !== undefined)
            setLinkedProductButtonText(String(bCfg.linkedProductButtonText));
          if (bCfg.defaultWarrantyFallback !== undefined)
            setDefaultWarrantyFallback(String(bCfg.defaultWarrantyFallback));

          if (bCfg.showRelatedPosts !== undefined)
            setShowRelatedPosts(Boolean(bCfg.showRelatedPosts));
          if (bCfg.relatedPostsTitle !== undefined)
            setRelatedPostsTitle(String(bCfg.relatedPostsTitle));
          if (bCfg.relatedPostLinkText !== undefined)
            setRelatedPostLinkText(String(bCfg.relatedPostLinkText));

          if (bCfg.ctaBoxEnabled !== undefined)
            setCtaBoxEnabled(Boolean(bCfg.ctaBoxEnabled));
          if (bCfg.ctaBoxTitle !== undefined)
            setCtaBoxTitle(String(bCfg.ctaBoxTitle));
          if (bCfg.ctaBoxSubtitle !== undefined)
            setCtaBoxSubtitle(String(bCfg.ctaBoxSubtitle));
          if (bCfg.ctaButtonText !== undefined)
            setCtaButtonText(String(bCfg.ctaButtonText));
          if (bCfg.ctaButtonUrl !== undefined)
            setCtaButtonUrl(String(bCfg.ctaButtonUrl));
          if (bCfg.archiveButtonText !== undefined)
            setArchiveButtonText(String(bCfg.archiveButtonText));
          if (bCfg.archiveButtonUrl !== undefined)
            setArchiveButtonUrl(String(bCfg.archiveButtonUrl));
        }
      }

      if (prodsRes && prodsRes.ok) {
        const pJson = await prodsRes.json();
        const pList = pJson.data || pJson.products || [];
        const mapped: CatalogProductItem[] = (
          Array.isArray(pList) ? pList : []
        ).map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "کالای منتخب",
          category: p.category || "راهنمای خرید و بررسی تخصصی",
          brand: String(p.brand || "").trim(),
          price: Number(p.discount_price || p.price || 0),
          image:
            p.image ||
            (Array.isArray(p.images) && p.images[0]) ||
            "/placeholder.png",
          warranty: String(p.warranty || "").trim(),
          specs: p.specs || {},
        }));
        setProducts(mapped);
      }
    } catch (e) {
      console.error("Blog manager load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostsAndProducts();

    const chPosts = supabase
      .channel("realtime-admin-blog-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPostsAndProducts();
        }
      )
      .subscribe();

    const chProducts = supabase
      .channel("realtime-admin-blog-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchPostsAndProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProducts);
      supabase.removeChannel(chPosts);
    };
  }, [fetchPostsAndProducts]);

  const makeSlug = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleSaveBlogPageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_blog_settings",
          showBreadcrumb,
          breadcrumbHomeLabel,
          breadcrumbBlogLabel,
          showReadingTime,
          readingTimePrefix,
          readingTimeUnit,
          showAuthor,
          authorPrefix,
          defaultAuthorName,
          showPublishDate,
          publishDatePrefix,
          showFeaturedImage,
          showLinkedProductCard,
          linkedProductBadge,
          linkedProductButtonText,
          defaultWarrantyFallback,
          showRelatedPosts,
          relatedPostsTitle,
          relatedPostLinkText,
          ctaBoxEnabled,
          ctaBoxTitle,
          ctaBoxSubtitle,
          ctaButtonText,
          ctaButtonUrl,
          archiveButtonText,
          archiveButtonUrl,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        setSettingsPanelOpen(false);
      } else {
        notify(json.message || "خطا در ذخیره تنظیمات.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRebuildAllFromRealProducts = async () => {
    if (
      !confirm(
        "آیا مطمئن هستید؟ تمامی مقالات متصل به محصولات بر اساس برند، گارانتی و قیمت واقعی ثبت‌شده در کاتالوگ بازسازی و اصلاح خواهند شد."
      )
    )
      return;
    soundEngine.playClick();
    setRebuilding(true);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rebuild_from_real_products" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchPostsAndProducts();
      } else {
        notify(json.message || "خطا در بازسازی مقالات.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setRebuilding(false);
    }
  };

  const handleSelectProductAutoFill = (prodId: string) => {
    soundEngine.playClick();
    setSelectedProductId(prodId);
    if (!prodId) return;

    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const autoKey = "خرید و قیمت " + prod.title;
    const autoTitle = "بررسی تخصصی، مشخصات فنی و راهنمای خرید " + prod.title;
    const autoSlug = makeSlug(prod.title) + "-review";
    const warrantyDescPart = prod.warranty ? ` و ${prod.warranty}` : "";
    const autoMeta =
      `بررسی تخصصی ${prod.title} در دسته ${prod.category} به همراه جدول مشخصات فنی، ارزش خرید و سفارش آنلاین با بهترین قیمت (${prod.price.toLocaleString("fa-IR")} تومان)${warrantyDescPart} در آکسون کور.`.slice(
        0,
        160
      );

    const specEntries =
      prod.specs && typeof prod.specs === "object"
        ? Object.entries(prod.specs).filter(([k, v]) => k && v)
        : [];

    const initialTableRows: TableRowBlock[] =
      specEntries.length > 0
        ? specEntries.map(([k, v]) => ({ label: String(k), value: String(v) }))
        : [
            { label: "عنوان محصول", value: prod.title },
            { label: "دسته‌بندی تخصصی", value: prod.category },
            ...(prod.brand
              ? [{ label: "برند سازنده", value: prod.brand }]
              : []),
            prod.warranty
              ? { label: "پوشش گارانتی", value: prod.warranty }
              : {
                  label: "تضمین کیفیت",
                  value: "بررسی سلامت فیزیکی پیش از ارسال",
                },
            {
              label: "قیمت روز در آکسون کور",
              value: `${prod.price.toLocaleString("fa-IR")} تومان`,
            },
          ];

    const newBlocks: StructuredArticleBlocks = {
      introHeading: `معرفی و بررسی تخصصی ${prod.title}`,
      introBody: `اگر به دنبال ${autoKey} با بررسی کامل مشخصات و بالاترین استاندارد ساخت هستید، ${prod.title} یکی از گزینه‌های کاربردی موجود در دسته ${prod.category} به شمار می‌رود که تعادل مناسبی میان کارایی، دوام و ارزش خرید ارائه می‌دهد.`,
      whyHeading: `چرا ${prod.title} ارزش خرید بالایی دارد؟`,
      whyBody: prod.brand
        ? `محصول ${prod.title} از برند ${prod.brand} طراحی شده و پس از بررسی کامل سلامت فیزیکی و بسته‌بندی ایمن به سراسر کشور ارسال می‌گردد.`
        : `محصول ${prod.title} پس از بررسی کامل سلامت فیزیکی و عملکرد، با بسته‌بندی ایمن به سراسر کشور ارسال می‌گردد.`,
      tableHeading: `جدول مشخصات کلیدی و شرایط عرضه ${prod.title}`,
      tableCol1Header: "شاخص بررسی",
      tableCol2Header: `وضعیت در ${prod.title}`,
      tableRows: initialTableRows,
      faqHeading: `سوالات متداول خریداران درباره ${prod.title}`,
      faqItems: [
        {
          question: `۱. وضعیت ضمانت و سلامت ${prod.title} چگونه است؟`,
          answer: prod.warranty
            ? `بله، این کالا همراه با ${prod.warranty} و تضمین سلامت فیزیکی عرضه می‌گردد.`
            : `تمامی کالاهای آکسون کور پیش از ارسال از نظر سلامت فیزیکی بررسی شده و با بسته‌بندی ایمن ارسال می‌گردند.`,
        },
        {
          question: "۲. نحوه ارسال سفارش به چه صورت است؟",
          answer:
            "سفارش‌های ثبت‌شده در کوتاه‌ترین زمان پردازش و از طریق پست پیشتاز یا تیپاکس به سراسر کشور ارسال می‌شوند.",
        },
      ],
      inArticleCtaEnabled: true,
      inArticleCtaTitle: `🛍️ مشاهده مشخصات و خرید آنلاین ${prod.title}`,
      inArticleCtaText: `برای ثبت سفارش مستقیم ${prod.title} با قیمت ${prod.price.toLocaleString("fa-IR")} تومان و ارسال سریع کلیک کنید:`,
      inArticleCtaButtonText: `خرید مستقیم ${prod.title} ←`,
      inArticleCtaUrl: `/products/${prod.id}`,
    };

    const generatedHtml = serializeBlocksToArticleHtml(newBlocks);

    setTargetKeyword(autoKey);
    setTitle(autoTitle);
    setSlug(autoSlug);
    setCategory(prod.category || "راهنمای خرید و بررسی تخصصی");
    setMetaDescription(autoMeta);
    if (prod.image) setImageUrl(prod.image);
    setBlocks(newBlocks);
    setContent(generatedHtml);

    notify(
      `✓ تمامی بخش‌های مقاله (تیترها، متن، جدول مشخصات، سوالات متداول و باکس خرید) بر اساس اطلاعات واقعی محصول «${prod.title}» آماده ویرایش شدند.`
    );
  };

  const handleGenerateAiSeoPost = async () => {
    const kw =
      targetKeyword.trim() || title.trim() || "راهنمای خرید کالای منتخب";
    soundEngine.playClick();
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai-seo-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKeyword: kw,
          targetProductId: selectedProductId || undefined,
          productId: selectedProductId || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(
          json.message || "✓ مقاله سئو با هوش مصنوعی تولید و در مجله منتشر شد."
        );
        await fetchPostsAndProducts();
      } else {
        notify(json.message || "خطا در تولید خودکار مقاله.", "error");
      }
    } catch {
      notify("خطا در ارتباط با موتور هوش مصنوعی.", "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  const resetForm = () => {
    soundEngine.playClick();
    setEditingId(null);
    setSelectedProductId("");
    setTitle("");
    setAuthor("");
    setSlug("");
    setTargetKeyword("");
    setCategory("راهنمای خرید و بررسی تخصصی");
    setMetaDescription("");
    setImageUrl("");
    setContent("");
    setBlocks(parseArticleHtmlToBlocks(""));
    setIsPublished(true);
    setEditorMode("visual");
  };

  const handleEditPost = (post: BlogPostItem) => {
    soundEngine.playClick();
    setEditingId(post.id);
    setTitle(post.title || "");
    setAuthor(post.author || "");
    setSlug(post.slug || "");
    setCategory(post.category || "راهنمای خرید و بررسی تخصصی");
    setMetaDescription(post.meta_description || "");
    setImageUrl(post.image_url || "");
    const rawHtml = post.content || "";
    setContent(rawHtml);
    setBlocks(parseArticleHtmlToBlocks(rawHtml));
    setIsPublished(post.is_published !== false);
    setEditorMode("visual");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTogglePublishQuick = async (post: BlogPostItem) => {
    soundEngine.playClick();
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_publish",
          id: post.id,
          is_published: !post.is_published,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(json.message);
        await fetchPostsAndProducts();
      }
    } catch {}
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      notify("عنوان و متن مقاله الزامی هستند.", "error");
      return;
    }

    soundEngine.playClick();
    setSaving(true);

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          title: title.trim(),
          author: author.trim(),
          slug: slug.trim() || makeSlug(title),
          category: category.trim() || "راهنمای خرید و بررسی تخصصی",
          image_url: imageUrl.trim() || "/placeholder.png",
          meta_description: metaDescription.trim() || title.trim(),
          content: content.trim(),
          is_published: isPublished,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify(
          json.message || "✓ مقاله با موفقیت در دیتابیس ذخیره و منتشر شد."
        );
        resetForm();
        await fetchPostsAndProducts();
      } else {
        notify(json.message || "خطا در ذخیره‌سازی مقاله.", "error");
      }
    } catch {
      notify("خطا در ارتباط با سرور.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    soundEngine.playClick();
    try {
      const res = await fetch("/api/blogs?id=" + encodeURIComponent(id), {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        soundEngine.playSuccess();
        notify("✓ مقاله با موفقیت حذف شد.");
        if (editingId === id) resetForm();
        await fetchPostsAndProducts();
      }
    } catch {
      notify("خطا در حذف مقاله.", "error");
    }
  };

  const wordCount = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const hasH2 = /<h2/i.test(content);
  const hasProductLink = /\/products\//i.test(content);
  const hasTable = /<table/i.test(content);
  const hasStandardTitle = title.trim().length >= 20;
  const hasStandardMeta = metaDescription.trim().length >= 50;

  const liveBlogSeoScore = Math.min(
    100,
    20 +
      (hasStandardTitle ? 15 : 0) +
      (hasStandardMeta ? 15 : 0) +
      (wordCount >= 120 ? 20 : Math.round((wordCount / 120) * 20)) +
      (hasH2 ? 10 : 0) +
      (hasProductLink ? 10 : 0) +
      (hasTable ? 10 : 0)
  );

  const filteredPosts = posts.filter((p) => {
    if (statusFilter === "published" && p.is_published === false) return false;
    if (statusFilter === "draft" && p.is_published !== false) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="space-y-6 font-sans select-text text-[var(--text-primary)]"
      dir="rtl"
    >
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
            <span>📚</span> مدیریت کامل مجله، وبلاگ و ویرایش تمام اجزای صفحه مقاله
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            ویرایش بخش‌بندی‌شده متون، جدول مشخصات، سوالات متداول، کارت محصول زیر مقاله، مقالات مرتبط و باکس مشاوره پایین صفحه
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setSettingsPanelOpen(!settingsPanelOpen);
            }}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white text-xs font-black cursor-pointer transition"
          >
            ⚙️ تنظیمات کامل تمام اجزای صفحه مقاله
          </button>

          <button
            type="button"
            disabled={rebuilding}
            onClick={handleRebuildAllFromRealProducts}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-50"
          >
            {rebuilding
              ? "⏳ در حال پاکسازی..."
              : "🧹 اصلاح خودکار مقالات فعلی"}
          </button>

          <button
            type="button"
            disabled={generatingAi}
            onClick={handleGenerateAiSeoPost}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-black text-xs shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {generatingAi ? "⏳ در حال نگارش..." : "🤖 تولید مقاله با AI"}
          </button>

          <Link
            href="/blog"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-sky-500 text-xs font-bold flex items-center gap-1.5"
          >
            <span>مشاهده مجله</span>
            <span>🔗</span>
          </Link>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
            >
              + مقاله جدید
            </button>
          )}
        </div>
      </div>

      {/* پنل تنظیمات جامع تمام اجزای صفحه مقاله (نوار مسیر، متادیتا، کارت محصول، مقالات مرتبط، باکس مشاوره) */}
      {settingsPanelOpen && (
        <form
          onSubmit={handleSaveBlogPageSettings}
          className="p-5 sm:p-7 rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent-blue)]/50 shadow-2xl space-y-6 text-xs animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="font-black text-sm sm:text-base text-[var(--accent-blue)]">
                ⚙️ کنترل کامل و یکپارچه تمامی متون و بخش‌های صفحه مقاله
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                هر بخش یا متنی که در صفحه مقالات نمایش داده می‌شود را از اینجا تغییر دهید یا غیرفعال کنید:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsPanelOpen(false)}
              className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* ۱. تنظیمات هدر مقاله، نوار مسیر، زمان مطالعه، نویسنده و تاریخ */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
              <h3 className="font-black text-[var(--accent-blue)]">
                ۱. نوار مسیر (Breadcrumb)، تصویر شاخص و اطلاعات نویسنده / تاریخ
              </h3>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBreadcrumb}
                    onChange={(e) => setShowBreadcrumb(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>نوار مسیر</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFeaturedImage}
                    onChange={(e) => setShowFeaturedImage(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>تصویر شاخص</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReadingTime}
                    onChange={(e) => setShowReadingTime(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>زمان مطالعه</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAuthor}
                    onChange={(e) => setShowAuthor(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>نام نویسنده</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPublishDate}
                    onChange={(e) => setShowPublishDate(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>تاریخ انتشار</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان خانه در نوار مسیر:
                </label>
                <input
                  type="text"
                  value={breadcrumbHomeLabel}
                  onChange={(e) => setBreadcrumbHomeLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان مجله در نوار مسیر:
                </label>
                <input
                  type="text"
                  value={breadcrumbBlogLabel}
                  onChange={(e) => setBreadcrumbBlogLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  نام پیش‌فرض نویسنده مقالات:
                </label>
                <input
                  type="text"
                  value={defaultAuthorName}
                  onChange={(e) => setDefaultAuthorName(e.target.value)}
                  placeholder="تحریریه فنی آکسون کور"
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  پیشوند زمان مطالعه:
                </label>
                <input
                  type="text"
                  value={readingTimePrefix}
                  onChange={(e) => setReadingTimePrefix(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  واحد زمان مطالعه:
                </label>
                <input
                  type="text"
                  value={readingTimeUnit}
                  onChange={(e) => setReadingTimeUnit(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  پیشوند تاریخ انتشار:
                </label>
                <input
                  type="text"
                  value={publishDatePrefix}
                  onChange={(e) => setPublishDatePrefix(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
            </div>
          </div>

          {/* ۲. کارت محصول مرتبط زیر مقاله */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2.5">
              <h3 className="font-black text-emerald-400">
                ۲. کارت محصول بررسی‌شده زیر مقاله
              </h3>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLinkedProductCard}
                  onChange={(e) => setShowLinkedProductCard(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>نمایش کارت محصول زیر مقاله</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن بج بالای کارت محصول:
                </label>
                <input
                  type="text"
                  value={linkedProductBadge}
                  onChange={(e) => setLinkedProductBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن دکمه خرید کارت محصول:
                </label>
                <input
                  type="text"
                  value={linkedProductButtonText}
                  onChange={(e) => setLinkedProductButtonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن جایگزین گارانتی (در صورت خالی بودن):
                </label>
                <input
                  type="text"
                  value={defaultWarrantyFallback}
                  onChange={(e) => setDefaultWarrantyFallback(e.target.value)}
                  placeholder="خالی = عدم نمایش برای کالاهای بدون گارانتی"
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
            </div>
          </div>

          {/* ۳. بخش مقالات مرتبط و باکس مشاوره پایین صفحه */}
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
              <h3 className="font-black text-indigo-400">
                ۳. بخش مقالات مرتبط و باکس مشاوره پایین صفحه
              </h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRelatedPosts}
                    onChange={(e) => setShowRelatedPosts(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>نمایش مقالات مرتبط</span>
                </label>
                <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ctaBoxEnabled}
                    onChange={(e) => setCtaBoxEnabled(e.target.checked)}
                    className="accent-[var(--accent-blue)]"
                  />
                  <span>نمایش باکس مشاوره پایین</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان بخش مقالات مرتبط:
                </label>
                <input
                  type="text"
                  value={relatedPostsTitle}
                  onChange={(e) => setRelatedPostsTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن دکمه مطالعه روی کارت‌های مرتبط:
                </label>
                <input
                  type="text"
                  value={relatedPostLinkText}
                  onChange={(e) => setRelatedPostLinkText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  عنوان باکس مشاوره پایین صفحه:
                </label>
                <input
                  type="text"
                  value={ctaBoxTitle}
                  onChange={(e) => setCtaBoxTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن توضیحات باکس مشاوره پایین صفحه:
                </label>
                <input
                  type="text"
                  value={ctaBoxSubtitle}
                  onChange={(e) => setCtaBoxSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن دکمه اصلی باکس مشاوره:
                </label>
                <input
                  type="text"
                  value={ctaButtonText}
                  onChange={(e) => setCtaButtonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  لینک دکمه اصلی:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={ctaButtonUrl}
                  onChange={(e) => setCtaButtonUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  متن دکمه دوم (آرشیو مجله):
                </label>
                <input
                  type="text"
                  value={archiveButtonText}
                  onChange={(e) => setArchiveButtonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">
                  لینک دکمه دوم:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={archiveButtonUrl}
                  onChange={(e) => setArchiveButtonUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSettingsPanelOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold cursor-pointer"
            >
              بستن
            </button>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black cursor-pointer disabled:opacity-50 shadow-lg"
            >
              {savingSettings
                ? "در حال ذخیره..."
                : "💾 ذخیره و اعمال تنظیمات در تمام مقالات"}
            </button>
          </div>
        </form>
      )}

      {statusMsg && (
        <div
          className={
            "p-4 rounded-2xl text-xs font-bold animate-fadeIn " +
            (statusMsg.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-500")
          }
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
        <form
          onSubmit={handleSavePost}
          className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-5"
        >
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/40 space-y-2">
            <label className="block font-black text-[var(--accent-blue)]">
              🎯 گام ۱: انتخاب محصول از کاتالوگ (پر شدن خودکار بر اساس اطلاعات واقعی کالا):
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProductAutoFill(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer text-[var(--text-primary)]"
            >
              <option value="">
                -- انتخاب محصول از کاتالوگ برای پر کردن خودکار فرم مقاله --
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  📦 {p.title} ({p.price.toLocaleString("fa-IR")} تومان)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                عنوان اصلی مقاله *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId) setSlug(makeSlug(e.target.value));
                }}
                placeholder="عنوان جامع مقاله..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نویسنده این مقاله (اختیاری):
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={defaultAuthorName || "تحریریه فنی آکسون کور"}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                دسته‌بندی مقاله:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                نامک (Slug):
              </label>
              <input
                type="text"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-[var(--text-secondary)]">
                تصویر شاخص مقاله:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-bold cursor-pointer shrink-0"
                >
                  ☁️ آپلود
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between mb-1.5">
                <label className="font-bold text-[var(--text-secondary)]">
                  توضیحات متا سئو (Meta Description):
                </label>
                <span className="font-mono text-[10px] text-slate-400">
                  {metaDescription.length} / 160 کاراکتر
                </span>
              </div>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="خلاصه سئو برای نمایش در نتایج گوگل..."
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* نوار انتخاب حالت ویرایشگر محتوا + امتیاز سئو */}
          <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[11px] font-black">
                <button
                  type="button"
                  onClick={() => {
                    setBlocks(parseArticleHtmlToBlocks(content));
                    setEditorMode("visual");
                  }}
                  className={
                    "px-3 py-1.5 rounded-xl cursor-pointer transition " +
                    (editorMode === "visual"
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "text-[var(--text-secondary)]")
                  }
                >
                  🧩 ویرایشگر بخش‌بندی‌شده (جدول، متن، FAQ)
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("html")}
                  className={
                    "px-3 py-1.5 rounded-xl cursor-pointer transition " +
                    (editorMode === "html"
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "text-[var(--text-secondary)]")
                  }
                >
                  💻 ویرایش کد HTML
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={
                    "px-3 py-1.5 rounded-xl cursor-pointer transition " +
                    (editorMode === "preview"
                      ? "bg-[var(--accent-blue)] text-white shadow"
                      : "text-[var(--text-secondary)]")
                  }
                >
                  👁️ پیش‌نمایش زنده
                </button>
              </div>

              <span
                className={
                  "px-3 py-1.5 rounded-xl font-mono font-black text-[11px] " +
                  (liveBlogSeoScore >= 85
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400")
                }
              >
                سئو: {liveBlogSeoScore}/100 ({wordCount} کلمه)
              </span>
            </div>

            {editorMode === "visual" && (
              <div className="space-y-4">
                {/* بلوک ۱: مقدمه */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                  <span className="font-black text-[var(--accent-blue)] block">
                    بخش ۱: تیتر و متن مقدمه مقاله
                  </span>
                  <input
                    type="text"
                    value={blocks.introHeading}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        introHeading: e.target.value,
                      }))
                    }
                    placeholder="تیتر بخش مقدمه (H2)..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                  />
                  <textarea
                    rows={3}
                    value={blocks.introBody}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        introBody: e.target.value,
                      }))
                    }
                    placeholder="متن پاراگراف مقدمه..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] leading-relaxed"
                  />
                </div>

                {/* بلوک ۲: بررسی و ارزش خرید */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2.5">
                  <span className="font-black text-[var(--accent-blue)] block">
                    بخش ۲: تیتر و متن بررسی تخصصی / ارزش خرید
                  </span>
                  <input
                    type="text"
                    value={blocks.whyHeading}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        whyHeading: e.target.value,
                      }))
                    }
                    placeholder="تیتر بخش بررسی..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                  />
                  <textarea
                    rows={3}
                    value={blocks.whyBody}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        whyBody: e.target.value,
                      }))
                    }
                    placeholder="متن توضیحات این بخش..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] leading-relaxed"
                  />
                </div>

                {/* بلوک ۳: جدول مشخصات کلیدی */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[var(--accent-blue)]">
                      بخش ۳: جدول مشخصات کلیدی (قابل ویرایش ردیف‌به‌ردیف)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlocksAndSyncHtml((b) => ({
                          ...b,
                          tableRows: [...b.tableRows, { label: "", value: "" }],
                        }))
                      }
                      className="px-3 py-1 rounded-xl bg-[var(--accent-blue)] text-white font-black text-[11px] cursor-pointer"
                    >
                      + افزودن ردیف
                    </button>
                  </div>

                  <input
                    type="text"
                    value={blocks.tableHeading}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        tableHeading: e.target.value,
                      }))
                    }
                    placeholder="عنوان بالای جدول..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={blocks.tableCol1Header}
                      onChange={(e) =>
                        updateBlocksAndSyncHtml((b) => ({
                          ...b,
                          tableCol1Header: e.target.value,
                        }))
                      }
                      placeholder="تیتر ستون اول"
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-center"
                    />
                    <input
                      type="text"
                      value={blocks.tableCol2Header}
                      onChange={(e) =>
                        updateBlocksAndSyncHtml((b) => ({
                          ...b,
                          tableCol2Header: e.target.value,
                        }))
                      }
                      placeholder="تیتر ستون دوم"
                      className="p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-black text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    {blocks.tableRows.map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) =>
                            updateBlocksAndSyncHtml((b) => {
                              const nextRows = [...b.tableRows];
                              nextRows[rIdx] = {
                                ...nextRows[rIdx],
                                label: e.target.value,
                              };
                              return { ...b, tableRows: nextRows };
                            })
                          }
                          placeholder="عنوان ویژگی"
                          className="w-1/3 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) =>
                            updateBlocksAndSyncHtml((b) => {
                              const nextRows = [...b.tableRows];
                              nextRows[rIdx] = {
                                ...nextRows[rIdx],
                                value: e.target.value,
                              };
                              return { ...b, tableRows: nextRows };
                            })
                          }
                          placeholder="مقدار / توضیح"
                          className="flex-1 p-2 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateBlocksAndSyncHtml((b) => ({
                              ...b,
                              tableRows: b.tableRows.filter(
                                (_, idx) => idx !== rIdx
                              ),
                            }))
                          }
                          className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white font-bold cursor-pointer shrink-0"
                          title="حذف این ردیف"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* بلوک ۴: سوالات متداول (FAQ) */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-400">
                      بخش ۴: سوالات متداول (FAQ)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlocksAndSyncHtml((b) => ({
                          ...b,
                          faqItems: [
                            ...b.faqItems,
                            { question: "", answer: "" },
                          ],
                        }))
                      }
                      className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-[11px] cursor-pointer"
                    >
                      + افزودن سوال
                    </button>
                  </div>

                  <input
                    type="text"
                    value={blocks.faqHeading}
                    onChange={(e) =>
                      updateBlocksAndSyncHtml((b) => ({
                        ...b,
                        faqHeading: e.target.value,
                      }))
                    }
                    placeholder="عنوان بخش سوالات متداول..."
                    className="w-full p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                  />

                  <div className="space-y-3">
                    {blocks.faqItems.map((faq, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-3 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) =>
                              updateBlocksAndSyncHtml((b) => {
                                const nextFaqs = [...b.faqItems];
                                nextFaqs[fIdx] = {
                                  ...nextFaqs[fIdx],
                                  question: e.target.value,
                                };
                                return { ...b, faqItems: nextFaqs };
                              })
                            }
                            placeholder="متن پرسش..."
                            className="flex-1 p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateBlocksAndSyncHtml((b) => ({
                                ...b,
                                faqItems: b.faqItems.filter(
                                  (_, idx) => idx !== fIdx
                                ),
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 font-bold cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) =>
                            updateBlocksAndSyncHtml((b) => {
                              const nextFaqs = [...b.faqItems];
                              nextFaqs[fIdx] = {
                                ...nextFaqs[fIdx],
                                answer: e.target.value,
                              };
                              return { ...b, faqItems: nextFaqs };
                            })
                          }
                          placeholder="متن پاسخ..."
                          className="w-full p-2 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* بلوک ۵: باکس آبی خرید مستقیم داخل مقاله */}
                <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-sky-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sky-400">
                      بخش ۵: باکس خرید مستقیم انتهای متن مقاله
                    </span>
                    <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blocks.inArticleCtaEnabled}
                        onChange={(e) =>
                          updateBlocksAndSyncHtml((b) => ({
                            ...b,
                            inArticleCtaEnabled: e.target.checked,
                          }))
                        }
                        className="accent-sky-500"
                      />
                      <span>فعال باشد</span>
                    </label>
                  </div>

                  {blocks.inArticleCtaEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={blocks.inArticleCtaTitle}
                        onChange={(e) =>
                          updateBlocksAndSyncHtml((b) => ({
                            ...b,
                            inArticleCtaTitle: e.target.value,
                          }))
                        }
                        placeholder="عنوان باکس خرید..."
                        className="sm:col-span-2 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                      />
                      <input
                        type="text"
                        value={blocks.inArticleCtaText}
                        onChange={(e) =>
                          updateBlocksAndSyncHtml((b) => ({
                            ...b,
                            inArticleCtaText: e.target.value,
                          }))
                        }
                        placeholder="متن توضیح باکس خرید..."
                        className="sm:col-span-2 p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)]"
                      />
                      <input
                        type="text"
                        value={blocks.inArticleCtaButtonText}
                        onChange={(e) =>
                          updateBlocksAndSyncHtml((b) => ({
                            ...b,
                            inArticleCtaButtonText: e.target.value,
                          }))
                        }
                        placeholder="متن دکمه خرید..."
                        className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-bold"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={blocks.inArticleCtaUrl}
                        onChange={(e) =>
                          updateBlocksAndSyncHtml((b) => ({
                            ...b,
                            inArticleCtaUrl: e.target.value,
                          }))
                        }
                        placeholder="/products/..."
                        className="p-2.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {editorMode === "html" && (
              <textarea
                rows={12}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="محتوای کامل مقاله (HTML)..."
                className="w-full p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none leading-loose focus:border-[var(--accent-blue)]"
              />
            )}

            {editorMode === "preview" && (
              <div
                className="w-full min-h-[260px] p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--accent-blue)]/50 leading-loose space-y-3 overflow-y-auto max-h-[500px]"
                dangerouslySetInnerHTML={{
                  __html: content || "<p>هنوز محتوایی وارد نشده است...</p>",
                }}
              />
            )}
          </div>

          <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent-blue)] cursor-pointer"
            />
            <span>انتشار مستقیم در مجله سایت و نقشه سایت گوگل (Sitemap)</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-xl cursor-pointer disabled:opacity-50"
          >
            {saving
              ? "در حال ذخیره در دیتابیس..."
              : editingId
              ? "💾 بروزرسانی و ذخیره تمام تغییرات مقاله"
              : "💾 ذخیره و انتشار مقاله سئو"}
          </button>
        </form>

        {/* ستون چپ: آرشیو مقالات مجله */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4 h-fit">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <h3 className="font-black text-sm">
              آرشیو مقالات مجله ({posts.length})
            </h3>
            <div className="flex gap-1 text-[10px] font-bold">
              {[
                { id: "all", label: "همه" },
                { id: "published", label: "منتشرشده" },
                { id: "draft", label: "پیش‌نویس" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  className={
                    "px-2.5 py-1 rounded-lg cursor-pointer " +
                    (statusFilter === st.id
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--text-secondary)]")
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 جستجو در عنوان یا دسته‌بندی مقالات..."
            className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)]"
          />

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              در حال بارگذاری مقالات...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="font-bold">هنوز مقاله‌ای در این بخش ثبت نشده است.</p>
              <button
                type="button"
                disabled={generatingAi}
                onClick={handleGenerateAiSeoPost}
                className="px-4 py-2 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs cursor-pointer"
              >
                🤖 تولید اولین مقاله سئو با ۱ کلیک
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={
                    "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition " +
                    (editingId === post.id
                      ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]"
                      : "bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--accent-blue)]/50")
                  }
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-14 h-12 rounded-xl object-cover shrink-0 border border-[var(--card-border)]"
                      />
                    )}
                    <div className="overflow-hidden space-y-0.5 min-w-0">
                      <h4 className="font-black text-xs truncate">{post.title}</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishQuick(post)}
                          className={
                            "px-2 py-0.5 rounded font-bold cursor-pointer " +
                            (post.is_published !== false
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400")
                          }
                        >
                          {post.is_published !== false
                            ? "منتشرشده ✓"
                            : "پیش‌نویس"}
                        </button>
                        <span
                          className="font-mono text-slate-400 truncate"
                          dir="ltr"
                        >
                          /blog/{post.slug || post.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug || post.id)}`}
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-sky-500 font-bold"
                      title="مشاهده مقاله در سایت"
                    >
                      🔗
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEditPost(post)}
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--modal-bg)] border border-[var(--card-border)] hover:border-[var(--accent-blue)] font-bold cursor-pointer"
                      title="ویرایش کامل مقاله"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold cursor-pointer transition"
                      title="حذف مقاله"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MediaUploadModal
        isOpen={isUploadOpen}
        bucket="blog"
        title="آپلود تصویر شاخص مقاله سئو"
        currentValue={imageUrl}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(url) => setImageUrl(url)}
      />
    </div>
  );
}

export default AdminBlogManager;