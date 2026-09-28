"use client";
import React, { useState, useEffect } from "react";
import { Database, Download, Upload, Clock, Shield, RefreshCw, CheckCircle } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";

export default function AdminBackupPage() {
  const [backing, setBacking]   = useState(false);
  const [restoring,setRestoring]= useState(false);
  const [lastBackup,setLast]    = useState<string|null>(null);
  const [backupList,setList]    = useState<string[]>([]);
  const [statusMsg, setStatus]  = useState<{type:"success"|"error";text:string}|null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("axon_last_backup");
      if (saved) setLast(saved);
      const list  = JSON.parse(localStorage.getItem("axon_backup_list") || "[]");
      setList(list);
    } catch {}
  }, []);

  const handleBackup = async () => {
    soundEngine.playClick();
    if (!confirm("پشتیبان‌گیری کامل انجام شود؟")) return;
    setBacking(true); setStatus(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error("خطا در دریافت پشتیبان");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url,
        download: "axon-backup-" + new Date().toISOString().slice(0,10) + ".json",
      });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      setLast(now);
      localStorage.setItem("axon_last_backup", now);
      const newList = [now, ...backupList].slice(0, 10);
      setList(newList);
      localStorage.setItem("axon_backup_list", JSON.stringify(newList));
      soundEngine.playSuccess?.();
      setStatus({ type: "success", text: "✓ فایل پشتیبان با موفقیت دانلود شد." });
    } catch (e: any) {
      setStatus({ type: "error", text: e.message || "خطا در پشتیبان‌گیری" });
    } finally {
      setBacking(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("بازیابی، داده‌های فعلی را جایگزین می‌کند. ادامه دهید؟")) { e.target.value = ""; return; }
    soundEngine.playClick(); setRestoring(true); setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res  = await fetch("/api/admin/backup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (d.success) {
        soundEngine.playSuccess?.();
        setStatus({ type: "success", text: "✓ داده‌ها با موفقیت بازیابی شدند." });
      } else {
        setStatus({ type: "error", text: d.message || "خطا در بازیابی" });
      }
    } catch (e: any) {
      setStatus({ type: "error", text: "فایل نامعتبر است: " + e.message });
    } finally {
      setRestoring(false);
      e.target.value = "";
      setTimeout(() => setStatus(null), 5000);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--text-primary)] max-w-2xl" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)] flex items-center gap-2">
          <Database size={22}/> پشتیبان‌گیری و بازیابی داده
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          پشتیبان‌گیری کامل از تمام داده‌های سایت — محصولات، سفارشات، مشتریان و تنظیمات
        </p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${statusMsg.type==="success"?"bg-emerald-500/15 border-emerald-500/30 text-emerald-600":"bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>
          {statusMsg.type==="success" ? <CheckCircle size={16}/> : <Shield size={16}/>}
          {statusMsg.text}
        </div>
      )}

      {/* وضعیت آخرین بکاپ */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black flex items-center gap-2"><Clock size={16}/> وضعیت پشتیبان‌گیری</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
            <p className="text-[10px] text-[var(--text-secondary)] font-bold">آخرین پشتیبان‌گیری</p>
            <p className="text-xs font-black">
              {lastBackup ? new Date(lastBackup).toLocaleString("fa-IR") : "هنوز انجام نشده"}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
            <p className="text-[10px] text-[var(--text-secondary)] font-bold">تعداد پشتیبان‌ها</p>
            <p className="text-xs font-black">{backupList.length} فایل ذخیره‌شده</p>
          </div>
        </div>
        {lastBackup && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 flex items-center gap-2">
            <CheckCircle size={14}/> سیستم پشتیبان‌گیری فعال است — کرون روزانه فعال
          </div>
        )}
      </div>

      {/* اکشن‌ها */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🛠️ عملیات</h2>

        <button onClick={handleBackup} disabled={backing}
          className="w-full p-5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg flex items-center justify-center gap-3">
          {backing
            ? <><RefreshCw size={20} className="animate-spin"/> در حال تهیه پشتیبان...</>
            : <><Download size={20}/> دانلود پشتیبان کامل (JSON)</>}
        </button>

        <div className="relative">
          <input type="file" accept=".json" onChange={handleRestore} disabled={restoring}
            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" id="restore-input"/>
          <label htmlFor="restore-input"
            className={`w-full p-5 rounded-2xl border-2 border-dashed border-[var(--card-border)] font-black text-sm transition flex items-center justify-center gap-3 cursor-pointer ${restoring?"opacity-50":"hover:border-[var(--accent-blue)] hover:bg-[var(--input-bg)]"} text-[var(--text-secondary)]`}>
            {restoring
              ? <><RefreshCw size={20} className="animate-spin"/> در حال بازیابی...</>
              : <><Upload size={20}/> بازیابی از فایل پشتیبان</>}
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 space-y-1">
          <p>⚠️ نکات مهم:</p>
          <ul className="list-disc list-inside space-y-0.5 font-medium">
            <li>پشتیبان‌گیری خودکار هر شب ساعت ۲ انجام می‌شود</li>
            <li>فایل JSON شامل تمام سفارشات، محصولات، مشتریان و تنظیمات است</li>
            <li>بازیابی داده‌های فعلی را جایگزین می‌کند — با احتیاط استفاده کنید</li>
          </ul>
        </div>
      </div>

      {/* تاریخچه پشتیبان‌گیری */}
      {backupList.length > 0 && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">📋 تاریخچه</h2>
          <div className="space-y-2">
            {backupList.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-[var(--accent-blue)]"/>
                  <span className="font-bold">{new Date(b).toLocaleString("fa-IR")}</span>
                </div>
                <span className="text-slate-400">پشتیبان #{backupList.length - i}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
