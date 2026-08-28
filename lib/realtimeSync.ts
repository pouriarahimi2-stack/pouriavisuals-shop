import { supabase } from "@/lib/supabase";

export function initRealtimeSync(): () => void {
  if (typeof window === "undefined") return () => {};

  const masterChannel = supabase
    .channel("axon_master_realtime_sync_v2026")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("products_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("orders_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_info" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("site_info_updated", {
            detail: payload.new || payload,
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "banners" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("banners_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tech_news" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("news_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "coupons" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("coupons_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "contact_messages" },
      (payload) => {
        window.dispatchEvent(
          new CustomEvent("contact_messages_updated", {
            detail: {
              eventType: payload.eventType,
              newRecord: payload.new,
              oldRecord: payload.old,
            },
          })
        );
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        if (process.env.NODE_ENV !== "production") {
          console.log("⚡ [Realtime Engine] Connected to Supabase WebSocket channel.");
        }
      }
    });

  return () => {
    supabase.removeChannel(masterChannel);
  };
}