"use client";
// File Path: components/admin/MediaUploadModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  bucket?: string;
  title?: string;
  currentValue?: string;
}

async function optimizeRasterImageIfNeeded(file: File, isLogoAsset: boolean): Promise<File> {
  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif" ||
    file.type.includes("icon") ||
    typeof document === "undefined"
  ) {
    return file;
  }
  if (!isLogoAsset && file.size < 300 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const maxDim = isLogoAsset ? 520 : 1280;
      let w = img.width;
      let h = img.height;
      if (w <= maxDim && h <= maxDim && file.size <= 140 * 1024) {
        resolve(file);
        return;
      }
      if (w > maxDim || h > maxDim) {
        if (w >= h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const outMime = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: outMime }));
          } else {
            resolve(file);
          }
        },
        outMime,
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      resolve(file);
    };
    img.src = objUrl;
  });
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  bucket = "products",
  title = "انتخاب و بارگذاری رسانه",
  currentValue = "",
}: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(currentValue || "");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentValue || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(currentValue || "");
      setPreviewUrl(currentValue || null);
      setErrorMsg(null);
      setActiveTab("upload");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, currentValue, title]);

  if (!isOpen) return null;

  const handleFile = async (rawFile: File) => {
    setErrorMsg(null);
    if (rawFile.size > 5 * 1024 * 1024) {
      setErrorMsg("حجم فایل نباید بیش از ۵ مگابایت باشد.");
      return;
    }
    setUploading(true);
    try {
      const processedFile = await optimizeRasterImageIfNeeded(
        rawFile,
        bucket === "site-assets"
      );
      setPreviewUrl(URL.createObjectURL(processedFile));

      const formData = new FormData();
      formData.append("file", processedFile);
      formData.append("bucket", bucket);

      const res = await fetch("/api/admin/upload?t=" + Date.now(), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-sans select-text"
      dir="rtl"
    >
      <div className="bg-[var(--modal-bg)] border border-[var(--card-border)] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-[var(--text-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
          <h3 className="text-sm font-black flex items-center gap-2">
            <span>🖼️</span> {title}
          </h3>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-1.5 p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "upload"
                ? "bg-[var(--accent-blue)] text-white shadow"
                : "text-[var(--text-secondary)]"
            }`}
          >
            📁 بارگذاری از کامپیوتر / گوشی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "url"
                ? "bg-[var(--accent-blue)] text-white shadow"
                : "text-[var(--text-secondary)]"
            }`}
          >
            🔗 آدرس مستقیم اینترنتی (URL)
          </button>
        </div>

        {activeTab === "upload" && (
          <div
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              fileInputRef.current?.click();
            }}
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
                <img
                  key={previewUrl.slice(-24) + "_" + previewUrl.length}
                  src={previewUrl}
                  alt=""
                  className="w-24 h-20 object-contain mx-auto rounded-xl border border-[var(--card-border)] p-1 bg-white/5"
                />
                <span className="text-[11px] text-[var(--accent-blue)] font-bold block">
                  {uploading ? "در حال آپلود و ذخیره‌سازی..." : "برای انتخاب تصویر جدید کلیک کنید"}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-3xl block">☁️</span>
                <span className="text-xs font-bold block">انتخاب فایل لوگو / تصویر از سیستم</span>
                <span className="text-[10px] text-slate-400 block">
                  PNG, WebP, JPG, SVG, ICO (حداکثر ۵MB)
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === "url" && (
          <form onSubmit={handleApplyUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                نشانی اینترنتی تصویر:
              </label>
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
              اعمال و ذخیره این آدرس ✓
            </button>
          </form>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)] text-xs">
          {currentValue ? (
            <button
              type="button"
              onClick={handleRemoveCurrent}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
            >
              حذف تصویر فعلی ✕
            </button>
          ) : (
            <div />
          )}
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
