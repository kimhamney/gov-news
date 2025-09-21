"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/types/article";
import { useLocaleMode } from "@/lib/localePref";

const PAGE_SIZE = 5;

export default function ArticlesSection({
  items,
  counts,
}: {
  items: Article[];
  counts?: Map<string, number>;
}) {
  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : 0;
      const tb = b.published_at ? Date.parse(b.published_at) : 0;
      return tb - ta;
    });
    return arr;
  }, [items]);

  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState<Article[]>(() =>
    sorted.slice(0, PAGE_SIZE)
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setPage(1);
    setVisible(sorted.slice(0, PAGE_SIZE));
    setLoading(false);
    setProgress(0);
  }, [sorted]);

  const preloadImages = useCallback(async (urls: (string | undefined)[]) => {
    const valid = urls.filter(Boolean) as string[];
    if (valid.length === 0) return;
    setProgress(5);
    let loaded = 0;
    await Promise.all(
      valid.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              loaded += 1;
              setProgress(Math.round((loaded / valid.length) * 100));
              resolve();
            };
            img.onerror = () => {
              loaded += 1;
              setProgress(Math.round((loaded / valid.length) * 100));
              resolve();
            };
            img.src = src;
          })
      )
    );
  }, []);

  const hasMore = page * PAGE_SIZE < sorted.length;

  const onLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setProgress(0);
    const start = page * PAGE_SIZE;
    const nextBatch = sorted.slice(start, start + PAGE_SIZE);
    await preloadImages(nextBatch.map((a) => a.hero_img ?? undefined));
    setVisible((prev) => prev.concat(nextBatch));
    setPage((p) => p + 1);
    setLoading(false);
    setProgress(0);
  }, [loading, hasMore, page, sorted, preloadImages]);

  const { mode } = useLocaleMode();
  const texts = {
    loadMore: mode === "ko" ? "더보기 5개" : "Load 5 more",
    loading: mode === "ko" ? "로딩 중…" : "Loading…",
    end: mode === "ko" ? "끝까지 봤어요" : "No more articles",
    loadingImages: mode === "ko" ? "이미지 로딩 중…" : "Loading images…",
  };

  return (
    <section className="space-y-3">
      <ul className="flex flex-col gap-3">
        {visible.map((a) => (
          <ArticleCard key={a.id} a={a} commentCount={counts?.get(a.id) ?? 0} />
        ))}
      </ul>
      {loading && (
        <div className="pt-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full w-0 rounded-full transition-[width] duration-200 ease-out"
              style={{
                width: `${Math.max(5, progress)}%`,
                background:
                  "linear-gradient(90deg, rgba(59,130,246,.8), rgba(99,102,241,.8))",
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            {texts.loadingImages} {Math.max(5, progress)}%
          </p>
        </div>
      )}
      <div className="py-2">
        <button
          onClick={onLoadMore}
          disabled={!hasMore || loading}
          className="mx-auto block rounded-xl border px-4 py-2 text-sm
                     disabled:opacity-50 hover:opacity-90 transition"
          style={{ borderColor: "var(--line)" }}
          aria-disabled={!hasMore || loading}
          x
        >
          {loading ? texts.loading : hasMore ? texts.loadMore : texts.end}
        </button>
      </div>
    </section>
  );
}
