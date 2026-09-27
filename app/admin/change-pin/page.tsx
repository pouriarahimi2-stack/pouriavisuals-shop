"use client";
import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/soundEngine";
import { ALL_ROLES } from "@/lib/rolePermissions";

export default function AdminChangePinPage() {
  const [user,            setUser]            = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName,        setFullName]        = useState("");
  const [loading,         setLoading]         = useState(false);
  const [status,          setStatus]          = useState<{type:"success"|"error";text:string}|null>(null);

  // فرم ایجاد کارمند جدید
  const [staffUser, setStaffUser] = useState("");
  const [staffPass, setStaffPass] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("support");
  const [staffLoading, setStaffLoading] = useState(false);

  // لیست کارکنان
  const [staff, setStaff] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const r = await fetch("/api/admin/change-pin");
      const d = await r.json();
      if (d.success && d.user) { setUser(d.user); setFullName(d.user.full_name || ""); }
      const r2 = await fetch("/api/admin/roles");
      const d2 = await r2.json();
      if (d2.success) setStaff(d2.users || []);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "تکرار رمز با رمز جدید مطابقت ندارد." }); return;
    }
    soundEngine.playClick(); setLoading(true); setStatus(null);
    try {
      const r = await fetch("/api/admin/change-pin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, newFullName: fullName }),
      });
      const d = await r.json();
      if (d.success) {
        soundEngine.playSuccess?.();
        setStatus({ type: "success", text: "✓ رمز عبور با موفقیت تغییر کرد." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        setStatus({ type: "error", text: d.message || "خطا در تغییر رمز." });
      }
    } catch { setStatus({ type: "error", text: "خطا در اتصال." }); }
    finally { setLoading(false); setTimeout(() => setStatus(null), 5000); }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick(); setStaffLoading(true); setStatus(null);
    try {
      const r = await fetch("/api/admin/roles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: staffUser, password: staffPass, full_name: staffName, role: staffRole }),
      });
      const d = await r.json();
      if (d.success) {
        soundEngine.playSuccess?.();
        setStatus({ type: "success", text: "✓ " + d.message });
        setStaffUser(""); setStaffPass(""); setStaffName(""); setStaffRole("support");
        loadData();
      } else {
        setStatus({ type: "error", text: d.message || "خطا." });
      }
    } catch { setStatus({ type: "error", text: "خطا." }); }
    finally { setStaffLoading(false); setTimeout(() => setStatus(null), 5000); }
  };

  const handleDeleteStaff = async (id: string, username: string) => {
    if (!confirm("حذف کاربر «" + username + "» تأیید می‌شود؟")) return;
    soundEngine.playClick();
    await fetch("/api/admin/roles?id=" + id, { method: "DELETE" });
    loadData();
  };

  const inp = "w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--accent-blue)] text-[var(--text-primary)]";

  return (
    <div className="space-y-6 max-w-2xl font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl">
        <h1 className="text-xl font-black text-[var(--accent-blue)]">🔐 مدیریت رمز عبور و کاربران</h1>
        {user && <p className="text-xs text-[var(--text-secondary)] mt-1">حساب فعلی: <span className="font-black text-[var(--text-primary)]">{user.full_name}</span> — <span className="font-mono">{user.username}</span></p>}
      </div>

      {status && <div className={`p-4 rounded-2xl text-xs font-bold border ${status.type==="success"?"bg-emerald-500/15 border-emerald-500/30 text-emerald-600":"bg-rose-500/15 border-rose-500/30 text-rose-600"}`}>{status.text}</div>}

      {/* تغییر رمز */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">🔑 تغییر رمز عبور</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">نام کامل</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inp}/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">رمز عبور فعلی *</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inp} placeholder="رمز فعلی"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">رمز جدید</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inp} placeholder="حداقل ۴ کاراکتر"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">تکرار رمز جدید</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inp} placeholder="تکرار رمز"/>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
            {loading ? "در حال ذخیره..." : "💾 ذخیره تغییرات"}
          </button>
        </form>
      </div>

      {/* ایجاد کارمند جدید */}
      <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
        <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">👤 افزودن کارمند / مدیر فرعی</h2>
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">نام کاربری *</label>
              <input type="text" required value={staffUser} onChange={e => setStaffUser(e.target.value)} className={inp} placeholder="فقط انگلیسی"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">رمز عبور *</label>
              <input type="password" required value={staffPass} onChange={e => setStaffPass(e.target.value)} className={inp} placeholder="حداقل ۴ کاراکتر"/>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">نام کامل</label>
            <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className={inp} placeholder="نام و نام خانوادگی"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text-secondary)]">نقش و سطح دسترسی</label>
            <select value={staffRole} onChange={e => setStaffRole(e.target.value)}
              className={inp + " cursor-pointer"}>
              {ALL_ROLES.filter(r => r.id !== "superadmin").map(r => (
                <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={staffLoading}
            className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
            {staffLoading ? "در حال ایجاد..." : "➕ ایجاد حساب کاربری"}
          </button>
        </form>
      </div>

      {/* لیست کارکنان */}
      {staff.length > 0 && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl space-y-4">
          <h2 className="text-sm font-black border-b border-[var(--card-border)] pb-2">📋 لیست کاربران پنل</h2>
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                <div>
                  <p className="text-xs font-black">{s.full_name || s.username}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono">{s.username} — {s.role}</p>
                </div>
                {s.role !== "superadmin" && (
                  <button onClick={() => handleDeleteStaff(s.id, s.username)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold cursor-pointer hover:bg-rose-500/20">
                    حذف
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
