"use client";

import React, { useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  bucket?: string;
  title?: string;
  currentValue?: string;
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  bucket = "products",
  title = "انتخاب و بارگذاری رسانه",
  currentValue = "",
}: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "library">("upload");
  const [urlInput, setUrlInput] = useState(currentValue || "");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentValue || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("حجم فایل نباید بیش از ۵ مگابایت باشد.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        onUploadSuccess(data.url);
        onClose();
      } else {
        setErrorMsg(data.message || "خطا در بارگذاری تصویر.");
      }
    } catch {
      setErrorMsg("ارتباط با سرور برقرار نشد.");
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    soundEngine.playSuccess();
    onUploadSuccess(urlInput.trim());
    onClose();
  };

  const handleRemoveCurrent = () => {
    soundEngine.playClick();
    onUploadSuccess("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-sans select-none" dir="rtl">
      <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-[var(--text-primary)]">
        
        {/* سربرگ مدال */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h3 className="text-sm font-black flex items-center gap-2">
            <span>🖼️</span> {title}
          </h3>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* انتخاب تب */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "upload" ? "bg-[var(--accent-blue)] text-white shadow" : "text-[var(--text-secondary)]"
            }`}
          >
            📁 بارگذاری از سیستم
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "url" ? "bg-[var(--accent-blue)] text-white shadow" : "text-[var(--text-secondary)]"
            }`}
          >
            🔗 آدرس مستقیم اینترنتی (URL)
          </button>
        </div>

        {/* تب ۱: آپلود فایل */}
        {activeTab === "upload" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent-blue)] rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] bg-[var(--input-bg)]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            {previewUrl ? (
              <div className="space-y-2">
                <img src={previewUrl} alt="" className="w-20 h-20 object-contain mx-auto rounded-xl border border-[var(--card-border)]" />
                <span className="text-[11px] text-slate-400 block">{uploading ? "در حال آپلود..." : "آماده بارگذاری"}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-3xl block">☁️</span>
                <span className="text-xs font-bold block">انتخاب فایل از کامپیوتر یا گوشی</span>
                <span className="text-[10px] text-slate-400 block">PNG, WebP, JPG, SVG, ICO (حداکثر ۵MB)</span>
              </div>
            )}
          </div>
        )}

        {/* تب ۲: درج آدرس URL */}
        {activeTab === "url" && (
          <form onSubmit={handleApplyUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">نشانی اینترنتی تصویر:</label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono text-xs outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            {urlInput && (
              <div className="p-2 border border-[var(--card-border)] rounded-2xl bg-[var(--input-bg)] flex justify-center">
                <img src={urlInput} alt="" className="max-h-24 object-contain rounded-xl" />
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 shadow-md cursor-pointer"
            >
              اعمال این آدرس ✓
            </button>
          </form>
        )}

        {/* دکمه‌های فوتر مدال */}
        <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-xs">
          {currentValue ? (
            <button
              type="button"
              onClick={handleRemoveCurrent}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
            >
              حذف تصویر فعلی ✕
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold cursor-pointer"
          >
            انصراف
          </button>
        </div>

      </div>
    </div>
  );
}
