"use client";
import Link from "next/link";
import { useLocaleMode } from "@/lib/localePref";
import { Article } from "@/types/article";
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

export default function ArticleCard({
  a,
  variant = "list",
  commentCount = 0,
}: {
  a?: Article;
  variant?: "list" | "detail";
  commentCount?: number;
}) {
  if (!a) return null;

  const { mode } = useLocaleMode();
  const title =
    mode === "ko" ? a.title_ko ?? a.title_en : a.title_en ?? a.title_ko;
  const summary =
    mode === "ko" ? a.summary_ko ?? a.summary_en : a.summary_en ?? a.summary_ko;

  if (variant === "detail") {
    return (
      <article className="relative card overflow-hidden">
        <div className="absolute right-4 top-4 z-10">
          <ScrapButton articleId={a.id} size="md" />
        </div>
        {a.hero_img ? (
          <img
            src={a.hero_img}
            alt=""
            className="w-full h-48 md:h-56 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-slate-100 grid place-items-center text-slate-400 text-xs">
            GOVNEWS
          </div>
        )}
        <div className="p-5 md:p-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-100">
              Canada BC
            </span>
            {a.published_at && <span>{fmt(a.published_at)}</span>}
          </div>
          <h1 className="text-[22px] md:text-[26px] font-extrabold leading-snug tracking-[-0.2px]">
            {title}
          </h1>
          {summary && (
            <p className="text-[14px] text-slate-700 leading-7">{summary}</p>
          )}
          {a.url && (
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand"
            >
              Open original
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M14 3h7v7m0-7L10 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 13v7H3V3h7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
      </article>
    );
  }

  return (
    <li className="relative card p-3 md:p-4 hover:shadow-md transition">
      <div className="absolute right-3 top-3 z-10">
        <ScrapButton articleId={a.id} size="sm" />
      </div>
      <Link
        href={`/articles/${encodeURIComponent(a.id)}`}
        className="flex gap-3 md:gap-4"
      >
        {a.hero_img ? (
          <img
            src={a.hero_img}
            alt=""
            className="h-20 w-28 md:w-32 object-cover rounded-xl shrink-0"
          />
        ) : (
          <div className="h-20 w-28 md:w-32 rounded-xl bg-slate-100 grid place-items-center text-slate-400 text-xs">
            GOVNEWS
          </div>
        )}
        <div className="min-w-0 flex-1 pr-10 md:pr-14">
          <h3 className="text-[15px] md:text-[16px] font-semibold leading-snug line-clamp-2">
            {title}
          </h3>
          {summary && (
            <p className="mt-1 text-[12px] text-slate-600 leading-5 line-clamp-2">
              {summary}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-full bg-slate-100">
              Canada BC
            </span>
            {a.published_at && <span>{fmt(a.published_at)}</span>}
            <span
              className="ml-auto px-2 py-0.5 rounded-full border"
              style={{ borderColor: "var(--line)" }}
            >
              {commentCount}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
