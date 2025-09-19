"use client";
import { useEffect, useState } from "react";

type News = {
  id: string;
  title_en: string;
  summary_en?: string;
  url: string;
  hero_img: string | null;
  published_at: string;
};

export default function NewsPage() {
  const [items, setItems] = useState<News[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = async (nextPage: number) => {
    setLoading(true);
    const res = await fetch(
      `/api/bc-news?page=${nextPage}&pageSize=9&enrich=1`,
      { cache: "no-store" }
    );
    const data = await res.json();
    setItems((prev) => [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setPage(data.page);
    setLoading(false);
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-semibold mb-4">BC Gov News</h1>
      <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((n) => (
          <li
            key={n.id}
            className="rounded-2xl shadow p-0 overflow-hidden bg-white"
          >
            <a href={n.url} target="_blank" rel="noreferrer">
              <div className="aspect-video bg-gray-100">
                {n.hero_img ? (
                  <img
                    src={n.hero_img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium line-clamp-2">{n.title_en}</h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                  {n.summary_en}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.published_at).toLocaleString()}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-4 py-2 rounded-xl shadow bg-black text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "더보기"}
          </button>
        </div>
      )}
    </main>
  );
}
