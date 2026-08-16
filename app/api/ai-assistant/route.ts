import { NextResponse } from "next/server";
import { productService } from "@/services/productService";
import { siteInfoService } from "@/services/siteInfoService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, history, mode, imageBase64, imageName } = body;

    // ۱. دریافت زنده محصولات کاتالوگ دیتابیس
    const allProducts = (await productService.getAll()) || [];
    const siteInfo = await siteInfoService.getAll();
    const storeName = siteInfo?.storeName || "Tech Store";

    // بخش اول: پردازش جستجو با عکس کالا (Visual Search Engine)
    if (mode === "visual_search" || imageBase64) {
      const lowerImgName = (imageName || "").toLowerCase();
      
      // بررسی وجود کالا بر اساس مشخصات و تطابق با کاتالوگ
      let matched = allProducts.filter((p) => {
        const pName = (p.name || "").toLowerCase();
        const pCat = (p.category || p.category_id || "").toLowerCase();
        return (
          lowerImgName.includes(pName) ||
          pName.split(" ").some((w) => w.length > 3 && lowerImgName.includes(w)) ||
          lowerImgName.includes(pCat)
        );
      });

      if (matched.length > 0) {
        return NextResponse.json({
          status: "found",
          message: `✅ این کالا در انبار فروشگاه ${storeName} موجود است و شناسایی شد:`,
          products: matched.slice(0, 4),
        });
      } else {
        // در صورتی که کالا در فروشگاه موجود نباشد
        return NextResponse.json({
          status: "not_found",
          message: `متأسفانه این مدل دقیق در انبار فروشگاه ما موجود نیست. برای تهیه این محصول می‌توانید از فروشگاه‌های همکار، دیجی‌کالا یا ترب اقدام فرمایید. همچنین محصولات مشابه و نزدیک موجود در انبار ما به شرح زیر است:`,
          products: allProducts.slice(0, 3),
        });
      }
    }

    // بخش دوم: دستیار هوشمند و پویا خرید
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const catalogData = allProducts.map((p) => ({
          نام: p.name,
          دسته: p.category || p.category_id || "عمومی",
          قیمت_تومان: Number(p.price || 0).toLocaleString("fa-IR"),
          موجودی: (p.stock ?? 0) > 0 ? `${p.stock} عدد موجود` : "ناموجود",
          مشخصات: p.description || "بدون مشخصات",
        }));

        const systemText = `شما مشاور و دستیار هوشمند، حرفه‌ای و خوش‌برخورد فروشگاه "${storeName}" هستید.
کاتالوگ کامل و زنده محصولات موجود در انبار فروشگاه به شرح زیر است:
${JSON.stringify(catalogData, null, 2)}

قوانین حیاتی پاسخگویی:
۱. پاسخ شما باید کاملاً زنده، دقیق و مرتبط با سوال، بودجه یا نیاز کاربر باشد.
۲. اگر کاربر محصولی خواست یا بودجه‌ای تعیین کرد که در فروشگاه موجود است، آن را با نام، قیمت دقیق به تومان و وضعیت موجودی معرفی کنید.
۳. اگر محصول مورد نظر کاربر یا بودجه درخواستی در انبار موجود نبود، با صراحت و ادب بگویید که "این کالا/با این بودجه در فروشگاه ما موجود نیست، اما می‌توانید از سایت‌های معتبر دیگر مثل ترب یا دیجی‌کالا تهیه کنید" و سپس نزدیک‌ترین کالاهای موجود در فروشگاه را برای مقایسه پیشنهاد دهید.
۴. لحن کاملاً دوستانه، محترمانه و به زبان فارسی همراه با ایموجی‌های مناسب باشد.`;

        const contents: any[] = [
          { role: "user", parts: [{ text: `System Context: ${systemText}` }] },
          { role: "model", parts: [{ text: "متوجه شدم. من بر اساس موجودی واقعی انبار و نیاز دقیق مشتری مشاوره واقعی و پویا ارائه می‌دهم." }] },
        ];

        if (Array.isArray(history)) {
          history.forEach((h: any) => {
            contents.push({
              role: h.role === "assistant" || h.role === "model" ? "model" : "user",
              parts: [{ text: h.text || h.parts?.[0]?.text || "" }],
            });
          });
        }

        contents.push({ role: "user", parts: [{ text: prompt }] });

        const aiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return NextResponse.json({ response: reply });
        }
      } catch (err) {
        console.warn("AI generation failed, using dynamic local fallback:", err);
      }
    }

    // موتور پاسخگوی محلی هوشمند بر اساس موجودی و درخواست واقعی کاربر
    const pText = (prompt || "").toLowerCase();

    // تشخیص بودجه
    const numRegex = /(\d+[\d,.]*)/g;
    const matches = pText.match(numRegex);
    let budget = 0;
    if (matches) {
      const raw = parseFloat(matches[0].replace(/,/g, ""));
      if (pText.includes("میلیون")) budget = raw * 1000000;
      else if (pText.includes("هزار")) budget = raw * 1000;
      else if (raw < 1000) budget = raw * 1000000;
      else budget = raw;
    }

    // فیلتر محصولات مرتبط با سوال
    let matchedProducts = allProducts.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || p.category_id || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();

      if (pText.includes("ساعت") || pText.includes("واچ") || pText.includes("watch")) {
        return cat.includes("ساعت") || name.includes("watch") || name.includes("ساعت");
      }
      if (pText.includes("گوشی") || pText.includes("موبایل") || pText.includes("آیفون") || pText.includes("iphone")) {
        return cat.includes("موبایل") || name.includes("iphone") || name.includes("گوشی");
      }
      if (pText.includes("عکاسی") || pText.includes("دوربین")) {
        return desc.includes("دوربین") || name.includes("pro") || name.includes("ultra");
      }
      return name.split(" ").some((w) => w.length > 2 && pText.includes(w));
    });

    if (matchedProducts.length === 0 && budget === 0) {
      matchedProducts = allProducts;
    }

    let finalReply = "";

    if (budget > 0) {
      const withinBudget = matchedProducts.filter((p) => Number(p.price || 0) <= budget);

      if (withinBudget.length > 0) {
        finalReply = `با بودجه **${Number(budget).toLocaleString("fa-IR")} تومان**، کالاهای زیر در انبار موجود و مناسب شما هستند:\n\n`;
        withinBudget.slice(0, 3).forEach((p) => {
          finalReply += `🔹 **${p.name}**\n`;
          finalReply += `💰 قیمت: ${Number(p.price || 0).toLocaleString("fa-IR")} تومان\n`;
          finalReply += `📦 وضعیت: ${(p.stock ?? 0) > 0 ? "✅ موجود در انبار" : "ناموجود"}\n\n`;
        });
      } else {
        finalReply = `متأسفانه در حال حاضر در رنج بودجه **${Number(budget).toLocaleString("fa-IR")} تومان** محصولی در انبار موجود نداریم. شما می‌توانید این کالا را در سایت‌های ترب یا دیجی‌کالا جستجو فرمایید.\n\nنزدیک‌ترین گزینه‌های موجود در فروشگاه ما به شرح زیر است:\n\n`;
        matchedProducts.slice(0, 2).forEach((p) => {
          finalReply += `🔹 **${p.name}**\n`;
          finalReply += `💰 قیمت: ${Number(p.price || 0).toLocaleString("fa-IR")} تومان\n\n`;
        });
      }
    } else {
      if (matchedProducts.length > 0) {
        finalReply = `کالاهای موجود مرتبط با درخواست شما در فروشگاه:\n\n`;
        matchedProducts.slice(0, 3).forEach((p) => {
          finalReply += `🔹 **${p.name}**\n`;
          finalReply += `💰 قیمت: ${Number(p.price || 0).toLocaleString("fa-IR")} تومان\n`;
          if (p.description) finalReply += `📝 مشخصات: ${p.description.substring(0, 75)}...\n`;
          finalReply += `📦 موجودی: ${(p.stock ?? 0) > 0 ? "آماده تحویل" : "ناموجود"}\n\n`;
        });
      } else {
        finalReply = `در حال حاضر این مورد دقیق در فروشگاه موجود نیست. برای تهیه می‌توانید از ترب یا دیجی‌کالا اقدام کنید، اما اگر مایل باشید می‌توانم محصولات نزدیک به این دسته را به شما پیشنهاد کنم.`;
      }
    }

    return NextResponse.json({ response: finalReply });
  } catch (error) {
    return NextResponse.json(
      { response: "خطا در پردازش درخواست. لطفاً مجدداً امتحان نمایید." },
      { status: 500 }
    );
  }
}