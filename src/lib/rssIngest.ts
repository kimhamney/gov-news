import Parser from "rss-parser";
import { fetchHeroImage } from "@/lib/fetchHeroImage";

export type FeedItem = {
  link?: string;
  guid?: string;
  title?: string;
  contentSnippet?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string; type?: string };
  [k: string]: any;
};

const FEED = "https://news.gov.bc.ca/feed";

export function extractMinistryFromUrl(url: string): string | undefined {
  const m = url.match(/releases\/\d+([A-Z]{2,5})\d+-/);
  return m?.[1];
}

export async function loadRss(): Promise<FeedItem[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(FEED);
  return (feed.items || []) as FeedItem[];
}

export function normalizeRss(items: FeedItem[]) {
  return items
    .map((it) => {
      const id = it.link || it.guid || "";
      return {
        url: it.link || "",
        title_en: it.title || "",
        summary_en: it.contentSnippet || "",
        published_at: new Date(
          it.isoDate || it.pubDate || Date.now()
        ).toISOString(),
        ministry: extractMinistryFromUrl(id),
        rss_image:
          (it as any)["media:content"]?.url || it.enclosure?.url || null,
      };
    })
    .filter((x) => x.url);
}

export async function enrichImages(rows: ReturnType<typeof normalizeRss>) {
  return Promise.all(
    rows.map(async (r) => {
      if (r.rss_image) return { ...r, hero_img: r.rss_image };
      const hero = await fetchHeroImage(r.url, 5000);
      return { ...r, hero_img: hero || null };
    })
  );
}
