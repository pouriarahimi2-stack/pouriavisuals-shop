/**
 * AXON CORE - Copilot Chat History, 14-Day Retention & FIFO 20 Limit (fix.js)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function writeFile(relPath, content) {
  const fullPath = path.join(process.cwd(), relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`\x1b[32m✔ ذخیره شد: ${relPath}\x1b[0m`);
}

console.log("\x1b[36m[AXON-HISTORY]\x1b[0m پیاده‌سازی تاریخچه هوشمند، نگهداری ۱۴ روزه و محدودیت ۲۰ نشست...");

// =============================================================================
// ۱. ساخت روت اختصاصی سرور: app/api/ai-assistant/history/route.ts
// =============================================================================
const historyApiRoute = `import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verifyAdminSession } from "@/lib/authSecurityHelper";

export const dynamic = "force-dynamic";

// دریافت تاریخچه‌ها همراه با اعمال خودکار قوانین ۱۴ روز و سقف ۲۰ نشست
export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    // ۱. پاکسازی گفتگوهای با عمر بیش از ۱۴ روز
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    await supabaseAdmin
      .from("copilot_chat_history")
      .delete()
      .lt("updated_at", fourteenDaysAgo.toISOString());

    // ۲. واکشی گفتگوها به ترتیب جدیدترین
    const { data: list, error } = await supabaseAdmin
      .from("copilot_chat_history")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // ۳. حفظ حداکثر ۲۰ نشست آخر (FIFO)
    if (list && list.length > 20) {
      const surplus = list.slice(20);
      const surplusIds = surplus.map(item => item.id);
      await supabaseAdmin.from("copilot_chat_history").delete().in("id", surplusIds);
      return NextResponse.json({ success: true, history: list.slice(0, 20) });
    }

    return NextResponse.json({ success: true, history: list || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ذخیره یا به‌روزرسانی نشست جاری
export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, message: "پیام‌ها الزامی است." }, { status: 400 });
    }

    const sessionId = id || ("chat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
    const firstUserMsg = messages.find((m: any) => m.role === "user");
    const sessionTitle = title || (firstUserMsg ? firstUserMsg.text.slice(0, 35) + "..." : "گفتگوی مدیریت");

    const payload = {
      id: sessionId,
      title: sessionTitle,
      messages,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin.from("copilot_chat_history").select("id").eq("id", sessionId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from("copilot_chat_history").update(payload).eq("id", sessionId);
    } else {
      payload["created_at"] = new Date().toISOString();
      await supabaseAdmin.from("copilot_chat_history").insert([payload]);
    }

    // حذف خودکار موارد مازاد بر ۲۰ نشست
    const { data: allList } = await supabaseAdmin
      .from("copilot_chat_history")
      .select("id")
      .order("updated_at", { ascending: false });

    if (allList && allList.length > 20) {
      const toDelete = allList.slice(20).map(i => i.id);
      await supabaseAdmin.from("copilot_chat_history").delete().in("id", toDelete);
    }

    return NextResponse.json({ success: true, sessionId, title: sessionTitle });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// حذف دستی یک نشست از تاریخچه
export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "شناسه الزامی است." }, { status: 400 });
    }

    await supabaseAdmin.from("copilot_chat_history").delete().eq("id", id);
    return NextResponse.json({ success: true, message: "نشست با موفقیت حذف شد." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
`;
writeFile('app/api/ai-assistant/history/route.ts', historyApiRoute);

// =============================================================================
// ۲. به‌روزرسانی components/admin/AdminAiMasterSuite.tsx با دکمه و پنل تاریخچه
// =============================================================================
const suiteFile = path.join(process.cwd(), 'components/admin/AdminAiMasterSuite.tsx');
let suiteContent = fs.readFileSync(suiteFile, 'utf8');

// افزودن استیت‌ها و توابع تاریخچه به کامپوننت
const historyStatesAndFunctions = `
  // استیت‌های اختصاصی تاریخچه گفتگوها
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [historyList, setHistoryList] = useState<Array<{ id: string; title: string; messages: ChatMessage[]; updated_at: string }>>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-assistant/history", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.history)) {
        setHistoryList(json.history);
      }
    } catch {} finally {
      setLoadingHistory(false);
    }
  };

  const autoSaveSession = async (updatedMessages: ChatMessage[]) => {
    try {
      const res = await fetch("/api/ai-assistant/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentSessionId || undefined,
          messages: updatedMessages
        })
      });
      const json = await res.json();
      if (json.success && json.sessionId) {
        setCurrentSessionId(json.sessionId);
      }
    } catch {}
  };

  const handleSelectHistorySession = (session: { id: string; messages: ChatMessage[] }) => {
    soundEngine.playClick();
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setIsHistoryOpen(false);
  };

  const handleStartNewChat = () => {
    soundEngine.playClick();
    setCurrentSessionId("");
    setMessages([
      {
        role: "copilot",
        text: "گفتگوی جدید آغاز شد. چه موردی را برای رشد کسب‌وکار و فروش بررسی کنیم؟",
        time: new Date().toLocaleTimeString("fa-IR")
      }
    ]);
  };

  const handleDeleteHistorySession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    try {
      await fetch("/api/ai-assistant/history?id=" + encodeURIComponent(id), { method: "DELETE" });
      setHistoryList(prev => prev.filter(item => item.id !== id));
      if (currentSessionId === id) handleStartNewChat();
    } catch {}
  };
`;

// تزریق استیت‌ها
if (!suiteContent.includes('currentSessionId')) {
  suiteContent = suiteContent.replace(
    'const [isCopilotThinking, setIsCopilotThinking] = useState(false);',
    'const [isCopilotThinking, setIsCopilotThinking] = useState(false);' + historyStatesAndFunctions
  );
}

// ذخیره خودکار در انتهای دریافت پاسخ هوش مصنوعی
if (!suiteContent.includes('autoSaveSession(updated)')) {
  suiteContent = suiteContent.replace(
    'setMessages(prev => [...prev, {',
    'const updated = [...messages, { role: "user" as const, text: userText, time: new Date().toLocaleTimeString("fa-IR") }, { role: "copilot" as const, text: reply, time: new Date().toLocaleTimeString("fa-IR") }]; autoSaveSession(updated); setMessages(prev => [...prev, {'
  );
}

// اضافه کردن دکمه تاریخچه در بالای تب کوپایلوت
const historyHeaderButtons = `
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  fetchHistory();
                  setIsHistoryOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--input-bg)] hover:border-[var(--accent-blue)] border border-[var(--card-border)] text-xs font-black text-[var(--accent-blue)] flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>📜</span>
                <span>تاریخچه گفتگوها (حداکثر ۲۰ نشست)</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewChat}
                className="px-3 py-1.5 rounded-xl bg-[var(--input-bg)] hover:border-emerald-500 border border-[var(--card-border)] text-xs font-bold text-emerald-500 cursor-pointer"
              >
                + گفتگوی جدید
              </button>
            </div>
`;

if (!suiteContent.includes('تاریخچه گفتگوها')) {
  suiteContent = suiteContent.replace(
    '<span className="text-xs font-bold text-[var(--text-secondary)]">پرسش و تحلیل راهبردی با داده‌های زنده بازار و کاتالوگ فروشگاه:</span>',
    '<span className="text-xs font-bold text-[var(--text-secondary)]">پرسش و تحلیل راهبردی با داده‌های زنده بازار:</span>' + historyHeaderButtons
  );
}

// مدال تاریخچه در انتهای تب کوپایلوت
const historyModalJsx = `
      {/* مدال تاریخچه گفتگوها با نگهداری ۱۴ روزه */}
      {isHistoryOpen && (
        <div
          onClick={() => setIsHistoryOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[var(--modal-bg)] border border-[var(--card-border)] p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <div>
                  <h3 className="font-black text-sm">تاریخچه گفتگوهای کوپایلوت</h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">نگهداری حداکثر ۲۰ نشست در بازه ۱۴ روزه</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--input-bg)] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-400 font-bold">در حال واکشی تاریخچه‌ها...</div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold">هنوز گفتگویی در دیتابیس ثبت نشده است.</div>
              ) : (
                historyList.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectHistorySession(session)}
                    className={"p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 " + (
                      currentSessionId === session.id
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 font-black"
                        : "border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent-blue)]/50"
                    )}
                  >
                    <div className="overflow-hidden space-y-0.5">
                      <h4 className="font-bold truncate text-[var(--text-primary)]">{session.title}</h4>
                      <span className="font-mono text-[9px] text-slate-400">
                        {new Date(session.updated_at).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistorySession(session.id, e)}
                      className="p-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition text-xs font-bold"
                      title="حذف نشست"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                handleStartNewChat();
                setIsHistoryOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white font-black text-xs hover:opacity-90 transition shadow-md"
            >
              + شروع گفتگوی جدید
            </button>
          </div>
        </div>
      )}
`;

if (!suiteContent.includes('isHistoryOpen &&')) {
  suiteContent = suiteContent.replace(
    '</form>\n        </div>\n      )}',
    '</form>\n        </div>\n      )}' + historyModalJsx
  );
}

writeFile('components/admin/AdminAiMasterSuite.tsx', suiteContent);

// =============================================================================
// ۳. تست بیلد کامل و پوش به گیت‌هاب و ورسل
// =============================================================================
console.log("تست بیلد کامل (npm run build)...");
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log("\x1b[32m✔ بیلد پروژه با موفقیت ۱۰۰٪ پاس شد.\x1b[0m");
} catch (e) {
  console.error("خطای بیلد:", e.message);
  process.exit(1);
}

console.log("ارسال قطعی تغییرات به گیت‌هاب و تریگر دیپلوی ورسل...");
try {
  execSync('git config --global http.sslBackend openssl', { stdio: 'inherit' });
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "feat(copilot): 14-day persistent chat history, max 20 sessions FIFO policy & realtime retrieval"', { stdio: 'inherit' });

  let branchName = 'main';
  try {
    branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main';
  } catch {
    branchName = 'main';
  }
  execSync('git push origin ' + branchName, { stdio: 'inherit' });
  console.log("\x1b[32m✔ سیستم تاریخچه کوپایلوت با موفقیت به گیت‌هاب Push شد و در حال استقرار است!\x1b[0m");
} catch (e) {
  console.error("خطای گیت:", e.message);
}