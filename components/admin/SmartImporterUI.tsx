"use client";

import { useState } from "react";

export default function SmartImporterUI() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [profitMargin, setProfitMargin] = useState<number>(20);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: "لطفاً ابتدا یک فایل (result.json) انتخاب کنید.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "در حال خواندن و پردازش فایل...", type: "success" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedData = JSON.parse(fileContent);
        
        // اضافه کردن حاشیه سود به دیتای ارسالی
        parsedData.profitMargin = profitMargin;

        setMessage({ text: "در حال ارتباط با هسته هوشمند ایمپورت...", type: "success" });

        const response = await fetch("/api/admin/import-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setMessage({ text: "✅ " + result.message, type: "success" });
          setFile(null); // ریست کردن فایل
        } else {
          setMessage({ text: "❌ خطا: " + result.message, type: "error" });
        }
      } catch (err: any) {
        setMessage({ text: "❌ خطای پردازش فایل: لطفاً مطمئن شوید فایل انتخابی JSON معتبر تلگرام است.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage({ text: "❌ خطا در خواندن فایل از سیستم شما.", type: "error" });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">ایمپورت هوشمند کاتالوگ (Universal Importer)</h2>
      <p className="text-sm text-gray-500 mb-6">
        فایل <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">result.json</code> استخراج شده از تلگرام را آپلود کنید تا سیستم به صورت خودکار کالاها، قیمت‌ها و تصاویر را متصل کند.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فایل دیتا (JSON)</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-white"
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حاشیه سود (درصد)</label>
          <input
            type="number"
            value={profitMargin}
            onChange={(e) => setProfitMargin(Number(e.target.value))}
            disabled={loading}
            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
          />
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            در حال پردازش...
          </>
        ) : (
          "شروع ایمپورت هوشمند"
        )}
      </button>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
