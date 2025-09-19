import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const p = path.join(process.cwd(), "mock", "crawled.json");
    const raw = await fs.readFile(p, "utf-8");
    const items = JSON.parse(raw);
    const item = Array.isArray(items)
      ? items.find((x: any) => x.id === id)
      : null;
    if (!item)
      return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
