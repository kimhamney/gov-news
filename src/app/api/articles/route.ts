import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "mock", "crawled.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(raw);

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("API error", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
