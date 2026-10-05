"use client";
// File Path: components/admin/AdminLiveChatNotifier.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { soundEngine } from "@/lib/soundEngine";
import { supabase } from "@/lib/supabase";

interface LiveAlertItem {
  alertId: string;
  sessionId: string;
  customerName: string;
  customerPhone: string;
  previewText: string;
  platform: string;
  createdAt: string;
}

export default function AdminLiveChatNotifier({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeToast, setActiveToast] = useState<LiveAlertItem | null>(null);
  const lastSeenAlertIdRef = useRef<string>("");
  const initializedRef = useRef<boolean>(false);

  const isViewerOnly = String(userRole || "").toLowerCase() === "viewer_reporter";

  const triggerAdminNotification = useCallback((alertObj: LiveAlertItem) => {
    try {
      soundEngine.playSuccess();
    } catch {}

    setActiveToast(alertObj);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const n = new Notification(`💬 پیام جدید از ${alertObj.customerName} (${alertObj.customerPhone})`, {
            body: alertObj.previewText,
            icon: "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
            router.push("/admin/messages?sessionId=" + encodeURIComponent(alertObj.sessionId));
          };
        } catch {}
      }
    }
  }, [router]);

  const checkLiveChatAlerts = useCallback(async () => {
    if (isViewerOnly) return;
    try {
      const res = await fetch("/api/live-chat?mode=admin&t=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.shouldNotify) return;

      const unreadCount = Number(json.totalUnread || 0);
      setTotalUnread(unreadCount);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("axon_live_chat_unread_count", { detail: unreadCount })
        );
      }

      const incomingAlert: LiveAlertItem | null = json.lastAlert || null;
      if (incomingAlert && incomingAlert.alertId) {
        if (!initializedRef.current) {
          lastSeenAlertIdRef.current = incomingAlert.alertId;
          initializedRef.current = true;
          // اگر در لحظه ورود پیام خوانده‌نشده داریم و در صفحه پیام‌ها نیستیم، به مدیر اطلاع بده
          if (unreadCount > 0 && !pathname.startsWith("/admin/messages")) {
            triggerAdminNotification(incomingAlert);
          }
          return;
        }

        if (incomingAlert.alertId !== lastSeenAlertIdRef.current) {
          lastSeenAlertIdRef.current = incomingAlert.alertId;
          triggerAdminNotification(incomingAlert);
        }
      } else {
        initializedRef.current = true;
      }
    } catch {}
  }, [isViewerOnly, pathname, triggerAdminNotification]);

  useEffect(() => {
    if (isViewerOnly) return;

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    checkLiveChatAlerts();

    const ch = supabase
      .channel("axon-admin-chat-notifier-" + Math.random().toString(36).slice(2, 8))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_info" },
        () => {
          checkLiveChatAlerts();
        }
      )
      .subscribe();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("axon_live_chat_realtime_bus");
      bc.onmessage = () => {
        checkLiveChatAlerts();
      };
    } catch {}

    const interval = setInterval(checkLiveChatAlerts, 3000);
    return () => {
      supabase.removeChannel(ch);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [isViewerOnly, checkLiveChatAlerts]);

  // اگر نقش کاربر «بیننده و گزارش‌دهنده» باشد هیچ نوتیفیکیشنی به او نشان داده نمی‌شود
  if (isViewerOnly) return null;

  return (
    <>
      {/* دکمه و نشانگر زنده پیام‌های جدید در هدر بالای پنل مدیریت */}
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          setActiveToast(null);
          router.push("/admin/messages");
        }}
        className={
          "px-3.5 py-1.5 rounded-xl border font-black transition cursor-pointer flex items-center gap-2 text-xs " +
          (totalUnread > 0
            ? "bg-rose-500 text-white border-rose-400 shadow-lg animate-pulse"
            : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]")
        }
        title="مشاهده گفتگوی زنده کاربران"
      >
        <span>🔔</span>
        <span>گفتگوی زنده</span>
        {totalUnread > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-white text-rose-600 font-mono text-[10px] font-black">
            {totalUnread} پیام جدید
          </span>
        )}
      </button>

      {/* پاپ‌آپ شناور بلادرنگ هنگام ارسال پیام جدید توسط کاربر */}
      {activeToast && (
        <div
          className="fixed bottom-6 left-6 z-50 w-[90vw] sm:w-96 p-4 rounded-3xl bg-slate-900/95 text-white border-2 border-sky-500 shadow-2xl space-y-3 font-sans select-text animate-bounce"
          dir="rtl"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <div className="text-xs font-black text-sky-400">
                  💬 پیام جدید در گفتگوی زنده سایت!
                </div>
                <div className="text-xs font-black mt-0.5">
                  👤 {activeToast.customerName} —{" "}
                  <span className="font-mono text-emerald-400">
                    {activeToast.customerPhone}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 text-xs font-bold leading-relaxed truncate">
            «{activeToast.previewText}»
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                const targetId = activeToast.sessionId;
                setActiveToast(null);
                router.push("/admin/messages?sessionId=" + encodeURIComponent(targetId));
              }}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition"
            >
              پاسخگویی فوری به کاربر ←
            </button>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
            >
              فعلاً ببند
            </button>
          </div>
        </div>
      )}
    </>
  );
}
