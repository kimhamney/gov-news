"use client";
import { useLocaleMode } from "@/lib/localePref";

export default function GlobalLocaleSwitcher() {
  const { mode, setMode } = useLocaleMode();
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="segment">
        <button onClick={() => setMode("ko")} aria-pressed={mode === "ko"}>
          ko
        </button>
        <button onClick={() => setMode("en")} aria-pressed={mode === "en"}>
          en
        </button>
      </div>
    </div>
  );
}
