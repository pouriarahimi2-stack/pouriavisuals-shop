"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { soundEngine } from "@/lib/soundEngine";

export interface AdminNotification {
  id: string;
  type: "order" | "inventory" | "user" | "system";
  title: string;
  message: string;
  created_at?: string;
  read?: boolean;
}

interface NotificationContextType {
  notifications: AdminNotification[];
  addNotification: (notif: Omit<AdminNotification, "id"> & { id?: string }) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function AdminNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const addNotification = (notif: Omit<AdminNotification, "id"> & { id?: string }) => {
    const newEntry: AdminNotification = {
      ...notif,
      id: notif.id || (Date.now().toString() + Math.random().toString(36).substring(2, 6)),
      created_at: notif.created_at || new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // گوش دادن به رویداد زنده ثبت سفارش جدید از طریق دیسپچر Realtime
  useEffect(() => {
    const handleOrderUpdate = (e: any) => {
      const payload = e.detail;
      if (payload?.eventType === "INSERT") {
        try {
          soundEngine.playSuccess();
        } catch {}
        addNotification({
          type: "order",
          title: "سفارش جدید ثبت شد! 🛍️",
          message: `سفارش جدید به مبلغ ${Number(payload.new?.final_amount || payload.new?.total_amount || 0).toLocaleString("fa-IR")} تومان ثبت گردید.`,
          id: payload.new?.id ? String(payload.new.id) : undefined,
        });
      }
    };

    window.addEventListener("db_orders_updated", handleOrderUpdate);
    return () => window.removeEventListener("db_orders_updated", handleOrderUpdate);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within an AdminNotificationProvider");
  }
  return context;
}


// Alias exports to satisfy existing layout imports
export const NotificationProvider = AdminNotificationProvider;
export default AdminNotificationProvider;
