"use client";
import { useEffect, useRef, useState } from "react";
import crawled from "@/crawled.json";

export default function NewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    if (done) return;
    const next = crawled.slice(page * 5, page * 5 + 5);
    setItems((prev) => [...prev, ...next]);
    setPage((p) => p + 1);
    if (page * 5 + 5 >= crawled.length) setDone(true);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !done) {
          load();
        }
      },
      { rootMargin: "200px" }
    );
    if (sentinelRef.current) io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [done]);

  return (
    <main>
      <ul>
        {items.map((n) => (
          <li key={n.id}>{n.title_en}</li>
        ))}
      </ul>
      <div ref={sentinelRef} style={{ height: 20 }} />
      {done && <p>끝!</p>}
    </main>
  );
}
