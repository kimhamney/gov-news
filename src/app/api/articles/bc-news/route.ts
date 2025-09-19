import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { fetchHeroImage } from "@/lib/fetchHeroImage";

type Item = {
  id: string;
  title_en: string;
  title_ko?: string;
  summary_en?: string;
  summary_ko?: string;
  url: string;
  hero_img: string | null;
  published_at: string;
  ministry?: string;
};

const FEED = "https://news.gov.bc.ca/feed";
const DEFAULT_PLACEHOLDER = "/images/placeholder.jpg";

function extractMinistryFromId(id: string) {
  const m = id.match(/releases\/\d+([A-Z]{2,5})\d+-/);
  return m?.[1] || undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Math.min(Number(searchParams.get("pageSize") || 10), 30);
  const enrich = searchParams.get("enrich") !== "0";

  const parser = new Parser();
  const feed = await parser.parseURL(FEED);

  const itemsRaw = (feed.items || []).sort(
    (a, b) =>
      new Date(b.isoDate || b.pubDate || 0).getTime() -
      new Date(a.isoDate || a.pubDate || 0).getTime()
  );

  const start = (page - 1) * pageSize;
  const slice = itemsRaw.slice(start, start + pageSize);

  const base: Item[] = slice.map((it) => {
    const id = it.link || it.guid || "";
    return {
      id,
      title_en: it.title || "",
      summary_en: it.contentSnippet || "",
      url: it.link || "",
      hero_img: null,
      published_at: new Date(
        it.isoDate || it.pubDate || Date.now()
      ).toISOString(),
      ministry: id ? extractMinistryFromId(id) : undefined,
    };
  });

  function pickFromRss(it: any) {
    const media =
      (it as any)["media:content"]?.url || (it as any).enclosure?.url;
    return media || null;
  }

  let enriched = base;
  if (enrich) {
    enriched = await Promise.all(
      base.map(async (it, idx) => {
        const rssImg = pickFromRss(slice[idx]);
        if (rssImg) return { ...it, hero_img: rssImg };
        const hero = await fetchHeroImage(it.url, 4000);
        return {
          ...it,
          hero_img: hero || `/images/ministry/${it.ministry || "DEFAULT"}.jpg`,
        };
      })
    );
  } else {
    enriched = base.map((it) => ({
      ...it,
      hero_img: `/images/ministry/${it.ministry || "DEFAULT"}.jpg`,
    }));
  }

  const hasMore = start + pageSize < itemsRaw.length;
  return NextResponse.json({
    items: enriched,
    page,
    pageSize,
    hasMore,
    total: itemsRaw.length,
  });
}
