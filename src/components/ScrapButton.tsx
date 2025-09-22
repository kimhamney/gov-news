"use client";
import { useMemo } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { openAuthDialog } from "@/components/AuthModal";
import { useScrapSafe } from "@/contexts/ScrapContext";

export default function ScrapButton({
  articleId,
  size = "md",
  className = "",
}: {
  articleId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const scrap = useScrapSafe();
  const ready = !!scrap?.ready;
  const active = ready && scrap!.isScrapped(articleId);

  const dims = useMemo(() => {
    if (size === "sm") return { btn: "h-8 w-8", icon: "w-4 h-4" };
    if (size === "lg") return { btn: "h-11 w-11", icon: "w-6 h-6" };
    return { btn: "h-9 w-9", icon: "w-5 h-5" };
  }, [size]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        console.log(
          "[ScrapButton] User not authenticated, opening auth dialog"
        );
        openAuthDialog("login");
        return;
      }

      if (!scrap || !ready) {
        console.log("[ScrapButton] Scrap context not ready");
        return;
      }

      console.log("[ScrapButton] Toggling scrap for article:", articleId);
      await scrap.toggle(articleId);
    } catch (error) {
      console.error("[ScrapButton] Error:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border ${
        dims.btn
      } grid place-items-center hover:opacity-80 transition-opacity ${
        active
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-[var(--line)]"
      } ${className}`}
      aria-pressed={!!active}
      aria-label={active ? "Unscrap" : "Scrap"}
      title={active ? "Remove from Scrap" : "Add to Scrap"}
      disabled={scrap ? !ready : false}
    >
      {active ? (
        <BookmarkCheck className={`${dims.icon} text-emerald-600`} />
      ) : (
        <Bookmark className={`${dims.icon} text-slate-700`} />
      )}
    </button>
  );
}
