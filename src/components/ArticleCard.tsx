"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useLocaleMode } from "@/lib/localePref";
import { Article } from "@/types/article";
import { MessageSquare, Share2 } from "lucide-react";
import ScrapButton from "@/components/ScrapButton";

function fmt(d?: string) {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t.getTime())) return "";
  return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(t.getDate()).padStart(2, "0")}`;
}

function CountPill({
  count,
  asButton = false,
  onClick,
}: {
  count: number;
  asButton?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] leading-none text-slate-700 bg-white/90 backdrop-blur-sm"
      style={{ borderColor: "var(--line)" }}
    >
      <MessageSquare className="w-3.5 h-3.5" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
  if (asButton) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center"
        aria-label={`comments ${count}`}
      >
        {inner}
      </button>
    );
  }
  return inner;
}

export default function ArticleCard({
  a,
  variant = "list",
  commentCount = 0,
  onCommentsClick,
}: {
  a?: Article;
  variant?: "list" | "detail";
  commentCount?: number;
  onCommentsClick?: () => void;
}) {
  if (!a) return null;

  const [count, setCount] = useState(commentCount);
  useEffect(() => setCount(commentCount), [commentCount]);
  useEffect(() => {
    const onCount = (e: Event) => {
      const ev = e as CustomEvent<{ articleId: string; count: number }>;
      if (ev.detail?.articleId === a.id) setCount(ev.detail.count);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("replies:count", onCount as EventListener);
      return () =>
        window.removeEventListener("replies:count", onCount as EventListener);
    }
  }, [a.id]);

  const { mode } = useLocaleMode();
  const title =
    mode === "ko" ? a.title_ko ?? a.title_en : a.title_en ?? a.title_ko;
  const summary =
    mode === "ko" ? a.summary_ko ?? a.summary_en : a.summary_en ?? a.summary_ko;

  const htmlFromFields =
    (a as any).content_html || (a as any).body_html || null;
  const rawBody =
    (mode === "ko"
      ? (a as any).content_ko || (a as any).body_ko
      : (a as any).content_en || (a as any).body_en) || null;
  const bodyHtml =
    htmlFromFields ?? (rawBody ? rawBody.replace(/\n/g, "<br/>") : null);

  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = title || "GOVNEWS";
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: text, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  }, [title]);

  if (variant === "detail") {
    return (
      <article className="overflow-hidden rounded-3xl shadow-sm">
        <div className="relative">
          {a.hero_img ? (
            <img
              src={a.hero_img}
              alt=""
              className="w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2/1] object-cover"
            />
          ) : (
            <div className="w-full aspect-[16/9] bg-slate-100 grid place-items-center text-slate-400 text-xs">
              GOVNEWS
            </div>
          )}
          <div className="absolute right-3 top-3 z-10">
            <ScrapButton articleId={a.id} size="sm" />
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-6">
          <h1 className="text-[20px] sm:text-[24px] md:text-[30px] font-extrabold leading-snug tracking-[-0.2px]">
            {title}
          </h1>

          {summary ? (
            <div
              className="rounded-2xl border bg-white/70 backdrop-blur px-4 py-3 sm:px-5 sm:py-4 text-[14px] sm:text-[15px] text-slate-700 leading-7"
              style={{ borderColor: "var(--line)" }}
            >
              {summary}
            </div>
          ) : null}
          {bodyHtml ? (
            <div
              className="prose prose-slate max-w-none text-[15px] sm:text-[16px] leading-6 prose-headings:tracking-tight prose-headings:font-semibold prose-img:rounded-xl prose-a:no-underline hover:prose-a:underline prose-p:my-2 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : null}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={share}
              className="inline-flex items-center gap-1.5 text-[12px] text-slate-700 px-2.5 py-1 rounded-lg border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--line)" }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {onCommentsClick ? (
              <CountPill asButton onClick={onCommentsClick} count={count} />
            ) : (
              <CountPill count={count} />
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <li
      className="relative p-0 overflow-hidden rounded-2xl border bg-white/90 backdrop-blur hover:shadow-md transition"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="absolute right-3 top-3 z-10">
        <ScrapButton articleId={a.id} size="sm" />
      </div>
      <Link href={`/articles/${encodeURIComponent(a.id)}`} className="block">
        <div className="flex gap-3 md:gap-4 p-3 md:p-4">
          <div className="h-20 w-28 md:w-32 shrink-0">
            {a.hero_img ? (
              <img
                src={a.hero_img}
                alt=""
                className="h-20 w-28 md:w-32 object-cover rounded-xl"
              />
            ) : (
              <div className="h-20 w-28 md:w-32 rounded-xl bg-slate-100 grid place-items-center text-slate-400 text-xs">
                GOVNEWS
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-16 md:pr-20">
            <h3 className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold leading-snug break-words">
              {title}
            </h3>
            {summary && (
              <p className="mt-1 hidden md:block text-[12px] text-slate-600 leading-5">
                {summary}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 rounded-full bg-slate-100">
                Canada BC
              </span>
              {a.published_at && <span>{fmt(a.published_at)}</span>}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
