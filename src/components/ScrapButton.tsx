"use client";
import { useEffect, useMemo, useState } from "react";
import { useScrap } from "@/contexts/ScrapContext";
import { supabase } from "@/lib/supabaseClient";
import { openAuthDialog } from "@/components/AuthModal";
import { Bookmark, BookmarkCheck } from "lucide-react";

export default function ScrapButton({
  articleId,
  size = "md",
  className = "",
}: {
  articleId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { isScrapped, toggle, ready } = useScrap();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && ready ? isScrapped(articleId) : false;

  const dims = useMemo(() => {
    if (size === "sm") return { btn: "h-8 w-8", icon: "w-4 h-4" };
    if (size === "lg") return { btn: "h-11 w-11", icon: "w-6 h-6" };
    return { btn: "h-9 w-9", icon: "w-5 h-5" };
  }, [size]);

  const ensureLogin = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      openAuthDialog("login");
      return false;
    }
    return true;
  };

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!(await ensureLogin())) return;
        await toggle(articleId);
      }}
      className={`rounded-full border ${
        dims.btn
      } grid place-items-center hover:opacity-80 transition-opacity ${
        active
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-[var(--line)]"
      } ${className}`}
      aria-pressed={active}
      aria-label={active ? "Unscrap" : "Scrap"}
      title={active ? "Remove from Scrap" : "Add to Scrap"}
      disabled={!ready}
    >
      {active ? (
        <BookmarkCheck className={`${dims.icon} text-emerald-600`} />
      ) : (
        <Bookmark className={`${dims.icon} text-slate-700`} />
      )}
    </button>
  );
}
