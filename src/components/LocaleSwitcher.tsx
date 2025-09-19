"use client";
import { useLocaleMode } from "@/lib/localePref";

export default function LocaleSwitcher() {
  const { mode, setMode } = useLocaleMode();
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => setMode("ko")}
        className={`px-2 py-1 rounded-md text-xs border ${
          mode === "ko"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-200"
        }`}
      >
        ko
      </button>
      <button
        onClick={() => setMode("en")}
        className={`px-2 py-1 rounded-md text-xs border ${
          mode === "en"
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-700 border-slate-200"
        }`}
      >
        en
      </button>
    </div>
  );
}
