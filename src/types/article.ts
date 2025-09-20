export type Article = {
  id: string;
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
