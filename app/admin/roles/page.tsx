"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Shield, Eye, EyeOff, RefreshCw } from "lucide-react";

const ROLE_COLORS: Record<string,string> = {
  superadmin: "text-rose-400   bg-rose-400/10",
  accountant: "text-emerald-400 bg-emerald-400/10",
  editor:     "text-blue-400    bg-blue-400/10",
  support:    "text-purple-400  bg-purple-400/10",
  viewer:     "text-slate-400   bg-slate-400/10",
};

export default function RolesPage() {
  const [users,      setUsers]      = useState<any[]>([]);
  const [roles,      setRoles]      = useState<any>({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState<{type:"success"|"error";text:string}|null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editUser,   setEditUser]   = useState<any>(null);
  const [showPass,   setShowPass]   = useState(false);
  // فرم
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [fullName,   setFullName]   = useState("");
  const [role,       setRole]       = useState("editor");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/roles");
      const d = await r.json();
      if (d.success) { setUsers(d.users||[]); setRoles(d.roles||{}); }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const showMsg = (type: "success"|"error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let r;
      if (editUser) {
        r = await fetch("/api/admin/roles", { method: "PATCH",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ id: editUser.id, role, full_name: fullName, password: password || undefined }) });
      } else {
        r = await fetch("/api/admin/roles", { method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ username, password, full_name: fullName, role }) });
      }
      const d = await r.json();
      if (d.success) { showMsg("success", d.message); setShowForm(false); resetForm(); load(); }
      else showMsg("error", d.message);
    } catch { showMsg("error", "خطا در ارتباط با سرور"); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm("آیا از حذف کاربر «" + name + "» مطمئنید؟")) return;
    const r = await fetch("/api/admin/roles?id=" + id, { method: "DELETE" });
    const d = await r.json();
    if (d.success) { showMsg("success", d.message); load(); }
    else showMsg("error", d.message);
  };

  const startEdit = (u: any) => {
    setEditUser(u); setUsername(u.username); setFullName(u.full_name||"");
    setRole(u.role||"viewer"); setPassword(""); setShowForm(true);
  };
  const resetForm = () => {
    setEditUser(null); setUsername(""); setPassword(""); setFullName(""); setRole("editor");
  };

  return (
    <div className="space-y-5 font-sans text-[var(--text-primary)]" dir="rtl">
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-black text-[var(--accent-blue)] flex items-center gap-2">
            <Shield size={20}/> ماتریس دسترسی — مدیریت کاربران ادمین
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">هر کاربر فقط به بخش‌های تعریف‌شده برای نقشش دسترسی دارد</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--card-hover)] transition cursor-pointer"><RefreshCw size={15}/></button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-blue)] text-white text-xs font-bold flex items-center gap-2 cursor-pointer">
            <Plus size={15}/> افزودن کاربر جدید
          </button>
        </div>
      </div>

      {msg && (
        <div className={"p-4 rounded-2xl text-xs font-bold " + (msg.type==="success"?"bg-emerald-500/10 text-emerald-400":"bg-rose-500/10 text-rose-400")}>
          {msg.text}
        </div>
      )}

      {/* فرم افزودن/ویرایش */}
      {showForm && (
        <div className="p-6 rounded-3xl bg-[var(--modal-bg)] border-2 border-[var(--accent-blue)]/30 shadow-xl space-y-4 text-xs">
          <h3 className="font-black text-sm">{editUser ? "ویرایش کاربر: " + editUser.username : "افزودن کاربر جدید"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام و نام‌خانوادگی</label>
              <input value={fullName} onChange={e=>setFullName(e.target.value)}
                placeholder="مثال: علی رضایی"
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none" />
            </div>
            {!editUser && (
              <div>
                <label className="block mb-1 font-bold text-[var(--text-secondary)]">نام کاربری *</label>
                <input required value={username} onChange={e=>setUsername(e.target.value.toLowerCase())}
                  placeholder="ali_rezaei" dir="ltr"
                  className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
              </div>
            )}
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">{editUser ? "رمز جدید (اختیاری)" : "رمز عبور *"}</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  required={!editUser} minLength={4} placeholder="حداقل ۴ نویسه" dir="ltr"
                  className="w-full p-3 pr-3 pl-9 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-mono outline-none" />
                <button type="button" onClick={()=>setShowPass(p=>!p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                  {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--text-secondary)]">نقش دسترسی *</label>
              <select value={role} onChange={e=>setRole(e.target.value)} required
                className="w-full p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold outline-none cursor-pointer">
                {Object.entries(roles).map(([k,v]:any) => (
                  <option key={k} value={k}>{v.label} — {v.description}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-[var(--card-border)]">
              <button type="submit" disabled={saving}
                className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs disabled:opacity-50 cursor-pointer">
                {saving ? "در حال ذخیره..." : editUser ? "ذخیره ویرایش" : "ثبت کاربر"}
              </button>
              <button type="button" onClick={()=>{setShowForm(false);resetForm();}}
                className="px-6 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] font-bold text-xs cursor-pointer">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول کاربران */}
      <div className="rounded-3xl border border-[var(--card-border)] overflow-hidden">
        {loading ? <p className="py-12 text-center text-xs text-slate-400">در حال بارگذاری...</p> :
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[var(--text-secondary)] font-bold">
              <th className="py-3 px-4 text-right">نام کاربر</th>
              <th className="py-3 px-4 text-right hidden sm:table-cell">نام کاربری</th>
              <th className="py-3 px-4 text-right">نقش</th>
              <th className="py-3 px-4 text-right">دسترسی‌ها</th>
              <th className="py-3 px-4 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {users.map(u => {
              const roleInfo = roles[u.role] || { label: u.role, routes: [] };
              const colorCls = ROLE_COLORS[u.role] || "text-slate-400 bg-slate-400/10";
              return (
                <tr key={u.id} className="hover:bg-[var(--card-hover)] transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] flex items-center justify-center font-black">
                        {(u.full_name||u.username||"?")[0].toUpperCase()}
                      </div>
                      <span className="font-bold">{u.full_name || u.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 hidden sm:table-cell">{u.username}</td>
                  <td className="py-3 px-4">
                    <span className={"px-2.5 py-1 rounded-full text-[10px] font-black " + colorCls}>{roleInfo.label}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {roleInfo.routes?.[0]==="*" ? "کامل" : (roleInfo.routes||[]).length + " بخش"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>startEdit(u)}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-blue-400 text-blue-400 font-bold flex items-center gap-1 transition cursor-pointer">
                        <Edit size={12}/> ویرایش
                      </button>
                      {u.role !== "superadmin" && (
                        <button onClick={()=>handleDelete(u.id, u.full_name||u.username)}
                          className="px-2.5 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-rose-400 text-rose-400 font-bold flex items-center gap-1 transition cursor-pointer">
                          <Trash2 size={12}/> حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>}
      </div>

      {/* راهنمای نقش‌ها */}
      <div className="p-5 rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] space-y-3">
        <h3 className="text-xs font-black text-[var(--accent-blue)]">راهنمای نقش‌ها و سطوح دسترسی:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(roles).map(([k,v]:any) => (
            <div key={k} className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
              <span className={"px-2 py-0.5 rounded-full text-[10px] font-black " + (ROLE_COLORS[k]||"text-slate-400 bg-slate-400/10")}>{v.label}</span>
              <p className="text-[11px] text-[var(--text-secondary)]">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}