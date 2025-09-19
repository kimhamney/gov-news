import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 5), 50);
  const cursorIdRaw = searchParams.get("cursorId");
  const cursorId = cursorIdRaw ? Number(cursorIdRaw) : null;

  const client = supabaseAnon();

  let query = client
    .from("bc_news")
    .select("id, url, title_en, summary_en, ministry, hero_img, published_at")
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursorId !== null) {
    query = query.lt("id", cursorId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  let nextCursorId: number | null = null;
  let items = data || [];

  if (items.length > limit) {
    const last = items.pop()!;
    nextCursorId = last.id;
  }

  return NextResponse.json({ ok: true, items, nextCursorId });
}
