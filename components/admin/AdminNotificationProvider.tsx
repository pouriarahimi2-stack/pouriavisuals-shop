"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  confirmAction: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const confirmAction = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  return (
    <NotificationContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* استک نمایش Toast در گوشه صفحه */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none font-sans" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-2xl text-xs font-bold shadow-2xl pointer-events-auto border backdrop-blur-xl animate-fadeIn transition-all ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
                : t.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-300"
                : "bg-slate-900/90 border-blue-500/40 text-blue-300"
            }`}
          >
            {t.type === "success" ? "✓ " : t.type === "error" ? "⚠️ " : "ℹ️ "}
            {t.message}
          </div>
        ))}
      </div>

      {/* دیالوگ مدرن تاییدیه حذف و عملیات حساس */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans" dir="rtl">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-white">
            <h3 className="font-black text-sm text-rose-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>{confirmModal.title}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {confirmModal.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
              >
                {confirmModal.cancelText || "انصراف"}
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg transition"
              >
                {confirmModal.confirmText || "تایید و اجرا"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      showToast: (msg: string) => console.log(msg),
      confirmAction: (opt: ConfirmOptions) => { if (window.confirm(opt.message)) opt.onConfirm(); },
    };
  }
  return context;
}
