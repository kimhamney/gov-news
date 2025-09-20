"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Share2, MessageSquare } from "lucide-react";
import type { Article } from "@/types/article";
import ScrapButton from "@/components/ScrapButton";
import CommentsSheet from "@/components/CommentsSheet";
import ArticleCard from "@/components/ArticleCard";

export default function DetailClient({
  item,
  initialReplies,
}: {
  item: Article;
  initialReplies: any[];
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number>(initialReplies.length);

  const doShare = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : item.url || "";
    const title = item.title_ko || item.title_en || "GOVNEWS";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch {}
  }, [item]);

  const HeaderBar = useMemo(
    () => (
      <div
        className="sticky top-0 z-30 -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 py-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="mx-auto max-w-5xl flex items-center gap-2">
          <div className="font-semibold text-sm truncate">
            {item.title_ko || item.title_en}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={doShare}
              aria-label="Share"
              className="w-8 h-8 grid place-items-center rounded-xl border border-transparent hover:border-[var(--line)]"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <ScrapButton articleId={item.id} size="md" />
          </div>
        </div>
      </div>
    ),
    [doShare, item]
  );

  return (
    <>
      {HeaderBar}
      <ArticleCard
        a={item}
        variant="detail"
        commentCount={count}
        onCommentsClick={() => setOpen(true)}
      />

      <CommentsSheet
        open={open}
        onClose={() => setOpen(false)}
        articleId={item.id}
        initialList={initialReplies}
        onCountChange={(n) => setCount(n)}
      />
    </>
  );
}
