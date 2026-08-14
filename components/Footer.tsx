"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteInfoService, SiteInfo } from "@/services/siteInfoService";
import { menuService, MenuItem } from "@/services/menuService";

export default function Footer() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [footerLinks, setFooterLinks] = useState<MenuItem[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    setSiteInfo(siteInfoService.getSiteInfo());
    const links = menuService
      .getMenuItems()
      .filter((item) => item.location === "footer" && item.isActive);
    setFooterLinks(links);
  }, []);

  return (
    <>
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-2xl text-white font-sans text-xs pt-12 pb-8 mt-16 relative z-10 select-none">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          
          {/* ۱. درباره فروشگاه */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="font-black text-sm text-indigo-400">
              {siteInfo?.storeName || "فروشگاه اینترنتی"}
            </h4>
            <p className="opacity-70 leading-relaxed text-[11px]">
              {siteInfo?.aboutText ||
                "مرجع تخصصی عرضه بهترین محصولات با بالاترین کیفیت، ضمانت اصالت کالا و پشتیبانی ۲۴ ساعته."}
            </p>
          </div>

          {/* ۲. لینک‌های دسترسی سریع و قوانین */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">دسترسی سریع</h4>
            <ul className="space-y-2 opacity-80 font-bold text-[11px]">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition block">
                  صفحه اصلی فروشگاه
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-indigo-400 transition block">
                  مجله تخصصی و مقالات
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-indigo-400 transition block">
                  پیگیری هوشمند سفارش
                </Link>
              </li>
              {footerLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.url} className="hover:text-indigo-400 transition block">
                    {link.title}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-indigo-400 transition text-right cursor-pointer text-indigo-300 font-extrabold"
                >
                  📜 قوانین و مقررات خرید
                </button>
              </li>
            </ul>
          </div>

          {/* ۳. راه‌های ارتباطی و پشتیبانی */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white">پشتیبانی و تماس</h4>
            <div className="space-y-2 opacity-80 text-[11px]">
              {siteInfo?.phone && (
                <p>📞 تلفن تماس: <span className="font-mono dir-ltr inline-block">{siteInfo.phone}</span></p>
              )}
              {siteInfo?.email && (
                <p>✉️ ایمیل: <span className="font-mono">{siteInfo.email}</span></p>
              )}
              {siteInfo?.address && (
                <p>📍 آدرس حضوری: {siteInfo.address}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              {siteInfo?.instagram && (
                <a
                  href={siteInfo.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-[10px] font-bold"
                >
                  📷 اینستاگرام
                </a>
              )}
              {siteInfo?.telegram && (
                <a
                  href={siteInfo.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-[10px] font-bold"
                >
                  ✈️ تلگرام
                </a>
              )}
            </div>
          </div>

          {/* ۴. جایگاه رسمی نماد اعتماد الکترونیکی (eNamad) */}
          <div className="space-y-3 flex flex-col items-start md:items-center">
            <h4 className="font-extrabold text-sm text-white">مجوزها و نماد اعتماد</h4>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-2 w-32 h-36 relative group">
              
              {/* ⚠️ کد اسکریپت دریافت شده از سامانه ای‌نماد در این بخش جایگذاری می‌شود */}
              <div id="enamad-trust-badge" className="flex flex-col items-center justify-center">
                <span className="text-2xl block mb-1">🛡️</span>
                <span className="text-[10px] font-bold text-indigo-300">نماد اعتماد الکترونیکی</span>
                <span className="text-[9px] opacity-50 block mt-1">تایید شده توسط وزارت صمت</span>
              </div>

              <div className="absolute inset-0 bg-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none border border-indigo-500/30" />
            </div>
          </div>

        </div>

        {/* کپی‌رایت نهایی */}
        <div className="max-w-6xl mx-auto px-4 pt-6 text-center text-[11px] opacity-40 font-medium">
          © تمامی حقوق مادی و معنوی این وب‌سایت متعلق به BitByPouria می‌باشد.
        </div>
      </footer>

      {/* مدال قوانین و مقررات خرید جهت احراز ای‌نماد */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full max-h-[80vh] bg-slate-900 border border-white/20 rounded-3xl p-6 md:p-8 text-white space-y-5 shadow-2xl overflow-y-auto relative text-xs">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 left-5 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-xs cursor-pointer transition"
            >
              ✕
            </button>

            <div className="border-b border-white/10 pb-3 space-y-1">
              <h3 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                <span>📜</span> قوانین و مقررات استفاده و ثبت سفارش
              </h3>
              <p className="opacity-60 text-[11px]">آخرین بروزرسانی: مرداد ۱۴۰۵</p>
            </div>

            <div className="space-y-4 leading-relaxed opacity-80 text-[11px]">
              <section className="space-y-1">
                <h5 className="font-bold text-white text-xs">۱. شرایط عمومی:</h5>
                <p>ورود کاربران به وب‌سایت و ثبت سفارش به منزله آگاهی کامل و پذیرفتن قوانین فروشگاه می‌باشد.</p>
              </section>

              <section className="space-y-1">
                <h5 className="font-bold text-white text-xs">۲. ثبت و ارسال سفارش:</h5>
                <p>کلیه سفارش‌های ثبت‌شده ظرف ۲۴ تا ۴۸ ساعت کاری پردازش شده و تحویل شرکت پست پیشتاز جهت ارسال می‌گردند.</p>
              </section>

              <section className="space-y-1">
                <h5 className="font-bold text-white text-xs">۳. ۷ روز مهلت بازگشت کالا:</h5>
                <p>در صورت وجود هرگونه مغایرت یا نقص فنی در کالای دریافتی، خریدار تا ۷ روز فرصت دارد موضوع را به پشتیبانی اطلاع دهد.</p>
              </section>

              <section className="space-y-1">
                <h5 className="font-bold text-white text-xs">۴. حفظ حریم خصوصی:</h5>
                <p>اطلاعات شخصی خریداران (شماره تماس، آدرس و کد پستی) نزد فروشگاه محفوظ بوده و فقط جهت ارسال مرسوله استفاده می‌شود.</p>
              </section>
            </div>

            <div className="pt-2 border-t border-white/10 text-left">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer hover:bg-indigo-500 transition"
              >
                متوجه شدم و می‌پذیرم
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}