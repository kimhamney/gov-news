import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import fs from "node:fs";
import path from "node:path";

const FEED = "https://news.gov.bc.ca/feed";

function toIso(d) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t.toISOString();
}

async function main() {
  const { data } = await axios.get(FEED, {
    headers: { "User-Agent": "GovNews/1.0" },
    timeout: 20000,
  });
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const xml = parser.parse(data);
  const items = xml?.rss?.channel?.item || [];
  const out = items.slice(0, 20).map((it) => ({
    id: Buffer.from(it.link).toString("base64").replace(/=+$/, ""),
    title_en: it.title?.trim() || "",
    summary_en: (it.description || "").replace(/<[^>]+>/g, "").trim(),
    url: it.link,
    hero_img: null,
    published_at: toIso(it.pubDate),
  }));
  const outPath = path.join(process.cwd(), "mock", "crawled.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} items`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
