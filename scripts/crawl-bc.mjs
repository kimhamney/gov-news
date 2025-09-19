import puppeteer from "puppeteer";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const START = process.env.START_URL || "https://news.gov.bc.ca/releases";
const COUNT = Math.max(
  1,
  Math.min(
    parseInt(process.env.COUNT ?? process.argv[2] ?? "80", 10) || 80,
    500
  )
);
const CONCURRENCY = Math.max(
  1,
  Math.min(
    parseInt(process.env.CONCURRENCY ?? process.argv[3] ?? "8", 10) || 8,
    16
  )
);
const MAX_CLICKS = Math.max(
  1,
  Math.min(
    parseInt(process.env.MAX_CLICKS ?? process.argv[4] ?? "50", 10) || 50,
    200
  )
);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function toIso(d) {
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t.toISOString();
}

async function getHtml(url) {
  const r = await axios.get(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html",
    },
    timeout: 20000,
    maxRedirects: 5,
  });
  return r.data;
}

function isHandler(u, base) {
  try {
    const x = new URL(u, base);
    return /\/releases\/[^/]+\/image($|\?)/i.test(x.pathname + x.search);
  } catch {
    return false;
  }
}

function firstValid(baseUrl, ...cands) {
  for (const c of cands) {
    if (!c) continue;
    if (isHandler(c, baseUrl)) continue;
    try {
      return new URL(c, baseUrl).toString();
    } catch {}
  }
  return null;
}

function parseDetail(html, url, fallbackTitle = "") {
  const $ = cheerio.load(html);
  const metaOg = $('meta[property="og:image"]').attr("content");
  const twImg = $('meta[name="twitter:image"]').attr("content");
  const fig = $("figure img").first().attr("src");
  const news =
    $('img[src*="/files/"]').first().attr("src") ||
    $('img[src*="azureedge"]').first().attr("src");
  const aJpg = $('a[href$=".jpg"],a[href$=".jpeg"],a[href$=".png"]')
    .first()
    .attr("href");
  const handler = $('a[href*="/image"]').first().attr("href") || null;

  const img = firstValid(url, metaOg, twImg, fig, news, aJpg);
  const desc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $("p").first().text().trim() ||
    "";
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    fallbackTitle ||
    "";
  const pub =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time[datetime]").attr("datetime") ||
    null;

  return {
    title,
    desc,
    img,
    handler: handler ? new URL(handler, url).toString() : null,
    published: toIso(pub),
  };
}

async function resolveHandler(handlerUrl) {
  try {
    const head = await axios.get(handlerUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/*;q=0.8,text/html",
      },
      timeout: 15000,
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const ct = (head.headers["content-type"] || "").toLowerCase();
    if (ct.startsWith("image/")) return handlerUrl;
    const loc = head.headers.location;
    if (loc) return new URL(loc, handlerUrl).toString();
  } catch {}
  try {
    const r = await axios.get(handlerUrl, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      timeout: 15000,
      maxRedirects: 5,
    });
    const $ = cheerio.load(r.data);
    const a =
      $('a[href$=".jpg"],a[href$=".jpeg"],a[href$=".png"]')
        .first()
        .attr("href") ||
      $("img[src$='.jpg'],img[src$='.jpeg'],img[src$='.png']")
        .first()
        .attr("src");
    if (a) return new URL(a, handlerUrl).toString();
  } catch {}
  return null;
}

async function collectLinksByClick() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.goto(START, { waitUntil: "domcontentloaded", timeout: 60000 });
  const seen = new Set();
  let clicks = 0;
  async function grab() {
    const items = await page.$$eval('a[href*="/releases/"]', (as) =>
      as.map((a) => ({ url: a.href, title: (a.textContent || "").trim() }))
    );
    const out = [];
    for (const it of items) {
      if (!/\/releases\/[0-9A-Z-]+$/i.test(it.url)) continue;
      if (seen.has(it.url)) continue;
      seen.add(it.url);
      out.push(it);
      if (seen.size >= COUNT) break;
    }
    return out;
  }
  let collected = [];
  collected.push(...(await grab()));
  while (collected.length < COUNT && clicks < MAX_CLICKS) {
    const prev = await page.$$eval('a[href*="/releases/"]', (as) => as.length);
    const clicked = await page.evaluate(() => {
      const isMatch = (e) => {
        const tx = (e.textContent || "").replace(/\s+/g, " ").trim();
        const id = e.id || "";
        const cls = e.className || "";
        return (
          /load\s*more\s*releases/i.test(tx) ||
          /load[-_\s]?more[-_\s]?releases/i.test(id) ||
          /load[-_\s]?more[-_\s]?releases/i.test(cls)
        );
      };
      const cand = Array.from(
        document.querySelectorAll('button,a,div[role="button"]')
      ).find((el) => isMatch(el) && el.offsetParent !== null);
      if (!cand) return false;
      cand.scrollIntoView({ block: "center" });
      cand.click();
      return true;
    });
    if (!clicked) break;
    await page
      .waitForFunction(
        (n) => document.querySelectorAll('a[href*="/releases/"]').length > n,
        { timeout: 15000 },
        prev
      )
      .catch(() => {});
    await page
      .waitForNetworkIdle({ idleTime: 800, timeout: 15000 })
      .catch(() => {});
    collected.push(...(await grab()));
    clicks += 1;
  }
  await browser.close();
  return collected.slice(0, COUNT);
}

async function mapLimit(list, limit, fn) {
  const ret = new Array(list.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= list.length) break;
      ret[idx] = await fn(list[idx], idx);
    }
  }
  const n = Math.max(1, Math.min(limit, list.length));
  await Promise.all(Array.from({ length: n }, worker));
  return ret;
}

async function main() {
  const index = await collectLinksByClick();
  const filled = await mapLimit(index, CONCURRENCY, async (row) => {
    try {
      const html = await getHtml(row.url);
      const d = parseDetail(html, row.url, row.title);
      let hero = d.img;
      if (!hero && d.handler) hero = await resolveHandler(d.handler);
      if (hero && isHandler(hero, row.url)) hero = null;
      return {
        id: Buffer.from(row.url).toString("base64").replace(/=+$/, ""),
        title_en: d.title,
        summary_en: d.desc,
        url: row.url,
        hero_img: hero,
        published_at: d.published,
      };
    } catch {
      return {
        id: Buffer.from(row.url).toString("base64").replace(/=+$/, ""),
        title_en: row.title,
        summary_en: "",
        url: row.url,
        hero_img: null,
        published_at: null,
      };
    }
  });
  const outPath = path.join(process.cwd(), "mock", "crawled.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(filled, null, 2));
  console.log(`Wrote ${filled.length} items`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
