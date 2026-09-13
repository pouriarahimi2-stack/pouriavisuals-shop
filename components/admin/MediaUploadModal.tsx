"use client";

import React, { useState, useRef } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  bucket?: string;
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  bucket = "products",
}: MediaUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("حجم فایل نباید بیش از ۵ مگابایت باشد.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("تنها فایل‌های تصویری مجاز هستند.");
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
            <span>🖼️</span> بارگذاری امن مدیا
          </h3>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[180px] ${
            dragActive
              ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
              : "border-[var(--card-border)] hover:border-slate-400 bg-[var(--input-bg)]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-xl mx-auto border border-[var(--card-border)]"
              />
              <span className="text-[11px] text-slate-400 block font-sans">
                {uploading ? "در حال ارسال و پالایش امنیتی..." : "آماده بارگذاری"}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-3xl block">☁️</span>
              <span className="text-xs font-bold text-[var(--text-primary)] block">
                فایل را اینجا بکشید یا برای انتخاب کلیک کنید
              </span>
              <span className="text-[10px] text-slate-400 block">
                فرمت‌های مجاز: PNG, WebP, JPG, SVG (حداکثر ۵ مگابایت)
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-slate-300 font-bold hover:opacity-80 transition disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
