"use client";
import { useMemo } from "react";
import ArticleCard from "@/components/ArticleCard";
import { Article } from "@/types/article";

export default function ArticlesSection({
  items,
  counts,
  initialScrapIds = [],
}: {
  items: Article[];
  counts?: Map<string, number>;
  initialScrapIds?: string[];
}) {
  const data = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : 0;
      const tb = b.published_at ? Date.parse(b.published_at) : 0;
      return tb - ta;
    });
    return arr;
  }, [items]);

  return (
    <section className="space-y-3">
      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((a) => (
          <ArticleCard key={a.id} a={a} commentCount={counts?.get(a.id) ?? 0} />
        ))}
      </ul>
    </section>
  );
}
