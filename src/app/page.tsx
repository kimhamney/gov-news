export const dynamic = "force-dynamic";
import ArticlesSection from "@/components/ArticlesSection";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { getServerSupabase } from "@/lib/supabaseServer";

type Article = {
  id: string;
  title_en: string;
  title_ko?: string;
  summary_en?: string;
  summary_ko?: string;
  url?: string;
  hero_img?: string | null;
  published_at?: string;
};

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
  const [{ data: userData }, repliesRes, scrapsRes] = await Promise.all([
    supabase.auth.getUser(),
    ids.length
      ? supabase.from("replies").select("article_id").in("article_id", ids)
      : Promise.resolve({ data: [] }),
    supabase.auth
      .getUser()
      .then(async ({ data }) =>
        data.user && ids.length
          ? supabase
              .from("scraps")
              .select("article_id")
              .eq("user_id", data.user.id)
              .in("article_id", ids)
          : { data: [] }
      ),
  ]);

  const counts = new Map<string, number>();
  ((repliesRes as any).data ?? []).forEach((r: { article_id: string }) => {
    counts.set(r.article_id, (counts.get(r.article_id) ?? 0) + 1);
  });

  const initialScrapIds: string[] = (
    ((scrapsRes as any).data ?? []) as Array<{ article_id: string }>
  ).map((x) => x.article_id);

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <ArticlesSection
        items={items}
        counts={counts}
        initialScrapIds={initialScrapIds}
      />
    </main>
  );
}
