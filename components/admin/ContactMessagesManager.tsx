'use client';

import React, { useState, useEffect } from 'react';

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMessage.id,
          admin_reply: replyText,
          status: 'answered',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessage.id ? { ...m, admin_reply: replyText, status: 'answered' } : m))
        );
        setSelectedMessage(null);
        setReplyText('');
      }
    } catch {}
    setSubmitting(false);
  };

  const filtered = messages.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-400">در حال واکشی پیام‌ها و درخواست‌های مشاوره...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">📩 مدیریت پیام‌ها و درخواست‌های مشاوره کاربران</h2>
          <p className="text-xs text-gray-500 mt-1">مشاهده و پاسخ‌دهی مستقیم پیام‌ها با ارسال خودکار پیامک به خریدار</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            همه ({messages.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            در انتظار پاسخ ({messages.filter((m) => m.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('answered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
              statusFilter === 'answered' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            پاسخ داده شده ({messages.filter((m) => m.status === 'answered').length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-xs font-bold">هیچ پیامی در این دسته‌بندی یافت نشد.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{msg.full_name}</span>
                  <span className="font-mono text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md text-[11px]" dir="ltr">
                    {msg.phone}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">«{msg.subject || 'عمومی'}»</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      msg.status === 'answered'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {msg.status === 'answered' ? 'پاسخ داده شد' : 'در انتظار پاسخ'}
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(msg.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
                {msg.message}
              </p>

              {msg.admin_reply && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                  <div className="font-bold text-[11px]">✍️ پاسخ ثبت شده توسط مدیریت:</div>
                  <p className="leading-relaxed">{msg.admin_reply}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSelectedMessage(msg);
                    setReplyText(msg.admin_reply || '');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {msg.admin_reply ? 'ویرایش و ارسال مجدد پاسخ ✏️' : 'پاسخ به کاربر و ارسال پیامک 💬'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                پاسخ به {selectedMessage.full_name} ({selectedMessage.phone})
              </h3>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <span className="font-bold text-gray-700 dark:text-gray-300">متن پیام کاربر: </span>
              {selectedMessage.message}
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-gray-700 dark:text-gray-300">
                متن پاسخ (پیامک خواهد شد):
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="متن پاسخ خود را بنویسید..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                انصراف
              </button>
              <button
                onClick={handleSendReply}
                disabled={submitting || !replyText.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {submitting ? 'در حال ارسال...' : 'تایید و ارسال پیامک'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}