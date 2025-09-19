import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { loadRss, normalizeRss, enrichImages } from "@/lib/rssIngest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (process.env.INGEST_KEY && key !== process.env.INGEST_KEY) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const items = await loadRss();
  const normalized = normalizeRss(items);
  const enriched = await enrichImages(normalized);

  const client = supabaseAdmin();

  for (const row of enriched) {
    const { url, title_en, summary_en, published_at, ministry, hero_img } =
      row as any;
    await client
      .from("bc_news")
      .upsert(
        {
          url,
          title_en,
          summary_en,
          ministry,
          published_at,
          hero_img,
        },
        { onConflict: "url" }
      )
      .select();
  }

  return NextResponse.json({ ok: true, inserted: enriched.length });
}
