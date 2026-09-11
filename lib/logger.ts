/**
 * AXON CORE - Centralized Structured Logger
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY" | "PAYMENT" | "AUDIT";

export const logger = {
  log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(meta ? { meta } : {}),
    };

    if (process.env.NODE_ENV === "production") {
      // در محیط پروداکشن می‌توان به سنسورهای مانیتورینگ مانند Sentry ارسال کرد
      if (level === "ERROR" || level === "SECURITY" || level === "PAYMENT") {
        console.error(JSON.stringify(payload));
      } else {
        console.log(JSON.stringify(payload));
      }
    } else {
      const color =
        level === "ERROR" ? "\x1b[31m" :
        level === "SECURITY" ? "\x1b[35m" :
        level === "PAYMENT" ? "\x1b[32m" :
        level === "WARN" ? "\x1b[33m" : "\x1b[36m";

      console.log(`${color}[${level}] ${timestamp}: ${message}\x1b[0m`, meta || "");
    }
  },

  info(msg: string, meta?: Record<string, any>) {
    this.log("INFO", msg, meta);
  },

  warn(msg: string, meta?: Record<string, any>) {
    this.log("WARN", msg, meta);
  },

  error(msg: string, meta?: Record<string, any>) {
    this.log("ERROR", msg, meta);
  },

  security(msg: string, meta?: Record<string, any>) {
    this.log("SECURITY", msg, meta);
  },

  payment(msg: string, meta?: Record<string, any>) {
    this.log("PAYMENT", msg, meta);
  },

  audit(msg: string, meta?: Record<string, any>) {
    this.log("AUDIT", msg, meta);
  },
};
