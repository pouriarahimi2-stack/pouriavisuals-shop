'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'vision'>('chat');

  // استیت‌های گفتگوی متنی
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'سلام! 👋 من دستیار هوشمند پوریا ویژوالز هستم. چطور می‌توانم در انتخاب مانیتور و تجهیزات کالیبراسیون و رنگ به شما کمک کنم؟',
    },
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // استیت‌های تحلیل تصویر / ویژن
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionAnalysis, setVisionAnalysis] = useState<string | null>(null);
  const [loadingVision, setLoadingVision] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ارسال چت متنی
  const handleSendChat = async () => {
    if (!input.trim() || loadingChat) return;
    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoadingChat(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, role: 'customer' }),
      });
      const data = await res.json();
      if (data && data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'پاسخی دریافت نشد. لطفاً مجدداً امتحان کنید.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'خطا در برقراری ارتباط با سامانه هوش مصنوعی.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  // انتخاب عکس از دستگاه
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setVisionAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // آنالیز هوشمند تصویر
  const handleAnalyzeImage = async () => {
    if (!selectedImage || loadingVision) return;
    setLoadingVision(true);
    setVisionAnalysis(null);

    try {
      const promptToSend = visionPrompt.trim()
        ? visionPrompt
        : 'این تصویر مانیتور یا ستاپ تصویری را به دقت تحلیل کن و در خصوص کالیبراسیون، پنل و تجهیزات پیشنهادی راهنمایی تخصصی ارائه بده.';

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          image: selectedImage,
          role: 'vision_analyzer',
        }),
      });

      const data = await res.json();
      if (data && data.response) {
        setVisionAnalysis(data.response);
      } else {
        setVisionAnalysis('امکان تحلیل تصویر وجود نداشت. لطفاً تصویر واضح‌تری آپلود کنید.');
      }
    } catch {
      setVisionAnalysis('خطا در تحلیل تصویر. اتصال اینترنت خود را بررسی کنید.');
    } finally {
      setLoadingVision(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans" dir="rtl">
      {/* دکمه شناور یکپارچه و جذاب */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg animate-pulse">
            ✨
          </div>
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs font-black tracking-wide">دستیار هوشمند پوریا ویژوالز</span>
            <span className="text-[10px] text-blue-100 font-medium">مشاوره خرید کالا و تحلیل عکس مانیتور</span>
          </div>
        </button>
      )}

      {/* مدال جامع دوکاره */}
      {isOpen && (
        <div className="w-[340px] sm:w-[460px] h-[580px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden text-slate-100 animate-fadeIn">
          {/* هدر مدال */}
          <div className="p-4 border-b border-slate-800 bg-slate-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-base font-black shadow-md">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black text-white">مرکز هوش مصنوعی پوریا ویژوالز</h4>
                <p className="text-[10px] text-slate-400">راهنمای تخصصی سیستم‌های مانیتورینگ رنگ و تدوین</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* تب سوییچر بین حالت‌ها */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-2">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'chat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>💬</span>
              <span>مشاوره خرید کالا</span>
            </button>
            <button
              onClick={() => setMode('vision')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'vision'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>📸</span>
              <span>تحلیل عکس و مانیتور</span>
            </button>
          </div>

          {/* محتوای تب چت */}
          {mode === 'chat' && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed scrollbar-thin">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl max-w-[88%] ${
                      m.role === 'user'
                        ? 'mr-auto bg-blue-600 text-white rounded-br-none font-medium'
                        : 'ml-auto bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none font-medium'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {loadingChat && (
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-blue-400 text-xs animate-pulse">
                    🔍 در حال جستجو و پردازش پاسخ تخصصی...
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="سؤال خود را درباره کالیبراسیون و مانیتورها بنویسید..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={loadingChat}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  ارسال
                </button>
              </div>
            </>
          )}

          {/* محتوای تب تحلیل عکس */}
          {mode === 'vision' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin flex flex-col justify-between">
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />

                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="text-3xl">📷</div>
                    <span className="font-black text-slate-200">آپلود عکس مانیتور یا ستاپ کاری</span>
                    <span className="text-[11px] text-slate-400">کلیک کنید یا تصویر را اینجا رها کنید</span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/40 p-2">
                    <div className="relative w-full h-40">
                      <Image
                        src={selectedImage}
                        alt="Uploaded preview"
                        fill
                        className="object-contain rounded-xl"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setVisionAnalysis(null);
                      }}
                      className="absolute top-3 left-3 bg-rose-600/90 text-white p-1.5 rounded-xl text-[10px] font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      حذف عکس ✕
                    </button>
                  </div>
                )}

                {selectedImage && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={visionPrompt}
                      onChange={(e) => setVisionPrompt(e.target.value)}
                      placeholder="توضیح اختیاری (مثلاً: این مانیتور برای کالرگریدینگ مناسب است؟)..."
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
                    />

                    <button
                      onClick={handleAnalyzeImage}
                      disabled={loadingVision}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {loadingVision ? '🔬 در حال تحلیل هوشمند پیکسل‌ها و مشخصات...' : '🚀 شروع آنالیز هوشمند تصویر'}
                    </button>
                  </div>
                )}

                {visionAnalysis && (
                  <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-200 leading-relaxed font-medium space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <span>📊 نتیجه ارزیابی:</span>
                    </div>
                    <p className="whitespace-pre-line text-[11px]">{visionAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}