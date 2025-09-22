export const dynamic = "force-dynamic";
import ArticlesSection from "@/components/ArticlesSection";
import FeaturedArticle from "@/components/FeaturedArticle";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { Article } from "@/types/article";

const fallback: Article[] = [];

async function getArticles(): Promise<{ items: Article[] }> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/api/articles`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { items: fallback };
    const data = await res.json();
    const items: Article[] =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : fallback;
    return { items };
  } catch {
    return { items: fallback };
  }
}

export default async function HomePage() {
  const [{ items }, supabase] = await Promise.all([
    getArticles(),
    getServerSupabase(),
  ]);
  const ids = items.map((a) => a.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [repliesRes, scrapsRes] = await Promise.all([
    ids.length
      ? supabase.from("replies").select("article_id").in("article_id", ids)
      : Promise.resolve({ data: [] }),
    user && ids.length
      ? supabase
          .from("scraps")
          .select("article_id")
          .eq("user_id", user.id)
          .in("article_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const counts = new Map<string, number>();
  ((repliesRes as any).data ?? []).forEach((r: { article_id: string }) => {
    counts.set(r.article_id, (counts.get(r.article_id) ?? 0) + 1);
  });

  const initialScrapIds: string[] = (
    ((scrapsRes as any).data ?? []) as Array<{ article_id: string }>
  ).map((x) => x.article_id);

  const [featured, ...rest] = items;

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-6">
      {featured ? (
        <FeaturedArticle item={featured} count={counts.get(featured.id) ?? 0} />
      ) : null}
      {rest.length ? (
        <ArticlesSection
          items={rest}
          counts={counts}
          initialScrapIds={initialScrapIds}
        />
      ) : null}
    </main>
  );
}
