/**
 * AXON CORE - Event-Driven Analytics & Funnel Tracking
 */

type EcommerceEvent = 
  | "view_product" 
  | "add_to_cart" 
  | "begin_checkout" 
  | "coupon_applied" 
  | "payment_started" 
  | "purchase";

export const analytics = {
  track(event: EcommerceEvent, payload?: Record<string, any>) {
    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      ...(payload ? { payload } : {}),
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("axon_analytics_funnel_log") || "[]");
        existing.push(eventData);
        // نگهداری ۱۰۰ رویداد آخر در لوکال استوریج
        if (existing.length > 100) existing.shift();
        localStorage.setItem("axon_analytics_funnel_log", JSON.stringify(existing));
      } catch {}
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`📊 [ANALYTICS_EVENT]: ${event}`, payload || "");
    }
  },
};
