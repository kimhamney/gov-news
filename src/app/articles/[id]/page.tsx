export const dynamic = "force-dynamic";
import { getBaseUrl } from "@/lib/getBaseUrl";
import ArticleCard from "@/components/ArticleCard";
import RepliesPanel from "@/components/RepliesPanel";
import { Article } from "@/types/article";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = (params as any)?.then ? await (params as any) : params;
  const id = (resolved as any)?.id;
  const base = await getBaseUrl();

  const [itemRes, supabase] = await Promise.all([
    fetch(`${base}/api/articles/${encodeURIComponent(id ?? "")}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    }),
    getServerSupabase(),
  ]);
  if (!id || !itemRes.ok)
    return <main className="mx-auto max-w-5xl p-4">Not found</main>;

  const { item } = (await itemRes.json()) as { item: Article };

  const [{ data: userData }, repliesRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("replies")
      .select("id,user_id,article_id,body,created_at")
      .eq("article_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const initialReplies = (repliesRes.data as any[]) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <ArticleCard a={item} variant="detail" />
      <RepliesPanel articleId={item.id} initialList={initialReplies} />
    </main>
  );
}
