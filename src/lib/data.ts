export type ArticleDetail = {
  title_en: string;
  title_ko?: string;
  summary_en?: string;
  summary_ko?: string;
  url: string;
  hero_img?: string | null;
  published_at?: string;
  content_en?: string;
  content_ko?: string;
};

export async function getItem(id: string): Promise<ArticleDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/articles/${id}`,
    { cache: "no-store", headers: { accept: "application/json" } }
  ).catch(() => null as any);
  if (!res || !res.ok) return null;
  return (await res.json()) as ArticleDetail;
}
