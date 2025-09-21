import puppeteer from "puppeteer";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const START = process.env.START_URL || "https://news.gov.bc.ca/releases";
const MAX_ITEMS = 50;
const COUNT = Math.max(
  1,
  Math.min(
    parseInt(process.env.COUNT ?? process.argv[2] ?? String(MAX_ITEMS), 10) ||
      MAX_ITEMS,
    MAX_ITEMS
  )
);
const CONCURRENCY = Math.max(
  1,
  Math.min(
    parseInt(process.env.CONCURRENCY ?? process.argv[3] ?? "6", 10) || 6,
    10
  )
);
const MAX_CLICKS = Math.max(
  1,
  Math.min(
    parseInt(process.env.MAX_CLICKS ?? process.argv[4] ?? "50", 10) || 50,
    100
  )
);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80&auto=format&fit=crop";

function toIsoStrict(v) {
  if (!v) return null;
  const d = new Date(v);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1971) return d.toISOString();
  return null;
}

function parseHumanDate(s) {
  if (!s) return null;

  const txt = s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/Sept\./gi, "Sep")
    .replace(/\bSept\b/gi, "Sep");

  const patterns = [
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:,)?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i,
    /(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{1,2}):(\d{2}))?/,
    /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const m = txt.match(pattern);
    if (!m) continue;

    let year,
      month,
      day,
      hh = "00",
      mm = "00";

    if (pattern === patterns[0]) {
      const monthNames = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const mi = monthNames.indexOf(m[1].slice(0, 3).toLowerCase());
      if (mi < 0) continue;
      month = mi + 1;
      day = parseInt(m[2], 10);
      year = parseInt(m[3], 10);

      if (m[4] && m[5]) {
        let h = parseInt(m[4], 10);
        const ampm = (m[6] || "").toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        hh = String(h).padStart(2, "0");
        mm = String(parseInt(m[5], 10)).padStart(2, "0");
      }
    } else if (pattern === patterns[1]) {
      year = parseInt(m[1], 10);
      month = parseInt(m[2], 10);
      day = parseInt(m[3], 10);
      if (m[4] && m[5]) {
        hh = String(parseInt(m[4], 10)).padStart(2, "0");
        mm = String(parseInt(m[5], 10)).padStart(2, "0");
      }
    } else if (pattern === patterns[2]) {
      const monthNames = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const mi = monthNames.indexOf(m[2].slice(0, 3).toLowerCase());
      if (mi < 0) continue;
      day = parseInt(m[1], 10);
      month = mi + 1;
      year = parseInt(m[3], 10);
    }

    if (
      year &&
      month &&
      day &&
      year > 1971 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const iso = new Date(
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
          2,
          "0"
        )}T${hh}:${mm}:00Z`
      );
      if (!isNaN(iso.getTime())) {
        return iso.toISOString();
      }
    }
  }

  return null;
}

async function getRenderedHtml(page, url) {
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  });

  try {
    await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle2"],
      timeout: 60000,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await page.content();
  } catch (error) {
    console.warn(`Failed to load ${url}:`, error.message);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    return await page.content();
  }
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
      const url = new URL(c, baseUrl).toString();
      if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) {
        return url;
      }
    } catch {}
  }
  return null;
}

function parseJsonLdDeep($) {
  const nodes = $('script[type="application/ld+json"]').toArray();
  const results = [];

  for (const n of nodes) {
    const txt = $(n).contents().text();
    try {
      const data = JSON.parse(txt);
      const stack = Array.isArray(data) ? [...data] : [data];

      while (stack.length) {
        const it = stack.shift();
        if (it && typeof it === "object") {
          results.push(it);
          if (Array.isArray(it["@graph"])) stack.push(...it["@graph"]);
          if (Array.isArray(it.itemListElement))
            stack.push(...it.itemListElement);
        }
      }
    } catch (e) {
      console.warn("JSON-LD parsing error:", e.message);
    }
  }

  const article =
    results.find((x) =>
      String(x["@type"] || "")
        .toLowerCase()
        .includes("newsarticle")
    ) ||
    results.find((x) =>
      String(x["@type"] || "")
        .toLowerCase()
        .includes("article")
    );

  const date =
    article?.datePublished ||
    article?.dateCreated ||
    article?.dateModified ||
    null;
  const body = article?.articleBody || null;

  return { date: toIsoStrict(date), body };
}

function extractContent($) {
  const targets = [
    ".news-release .content",
    ".news-release__content",
    ".release-content",
    ".news-release-content",
    ".news-release",
    ".content-body",
    ".entry-content",
    "article .content",
    "article",
    ".main-content",
    "#main-content",
    "#main",
    "main",
  ];

  for (const sel of targets) {
    const root = $(sel);
    if (root.length) {
      const blocks = [];
      root.find("p, li, div").each((_, el) => {
        const $el = $(el);
        if ($el.closest(".sidebar, .nav, .menu, .footer, .header").length)
          return;

        const t = $el.text().replace(/\s+/g, " ").trim();
        if (t && t.length > 10) blocks.push(t);
      });

      const joined = blocks.join("\n\n").trim();
      if (joined.length > 200) return joined;
    }
  }

  const ps = $("p")
    .toArray()
    .map((p) => $(p).text().replace(/\s+/g, " ").trim())
    .filter((text) => text && text.length > 10);

  return ps.slice(0, 30).join("\n\n");
}

function parseDetail(html, url, fallbackTitle = "") {
  const $ = cheerio.load(html);

  const imageSelectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="twitter:image"]',
    ".news-release img[src]",
    ".hero-image img[src]",
    ".featured-image img[src]",
    "figure img[src]",
    'img[src*="/files/"]',
    'img[src*="azureedge"]',
    'img[src*="gov.bc.ca"]',
    'img[src]:not([src*="logo"]):not([src*="icon"])',
  ];

  let img = null;
  for (const selector of imageSelectors) {
    const element = $(selector).first();
    const src = element.attr("content") || element.attr("src");
    if (src && src.length > 10) {
      img = firstValid(url, src);
      if (img) break;
    }
  }

  const aJpg = $(
    'a[href$=".jpg"],a[href$=".jpeg"],a[href$=".png"],a[href*="image"]'
  )
    .first()
    .attr("href");
  if (!img && aJpg) {
    img = firstValid(url, aJpg);
  }

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $(".news-release h1").first().text().trim() ||
    $(".news-release__title").first().text().trim() ||
    fallbackTitle ||
    "";

  const desc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $(".news-release .summary").first().text().trim() ||
    $("p").first().text().trim() ||
    "";

  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="pubdate"]',
    'meta[name="date"]',
    'meta[name="dc.date"]',
    'meta[name="dc.date.issued"]',
    'meta[property="article:published"]',
  ];

  const metaDates = dateSelectors
    .map((sel) => $(sel).attr("content"))
    .filter(Boolean);

  const timeAttr = $("time[datetime]").attr("datetime") || null;

  const dateTextSources = [
    $('*[class*="date"], *[id*="date"]').first().text(),
    $("time").first().text(),
    $(".news-release .date").text(),
    $(".publish-date").text(),
    $(".publication-date").text(),
    $(".news-release p").first().text(),
    $(".release-date").text(),
  ];

  let dateText = "";
  for (const source of dateTextSources) {
    const text = (source || "").trim();
    if (text && text.length > 5) {
      dateText = text;
      break;
    }
  }

  const ld = parseJsonLdDeep($);

  const published =
    ld.date ||
    metaDates.map(toIsoStrict).find(Boolean) ||
    toIsoStrict(timeAttr) ||
    parseHumanDate(dateText) ||
    parseHumanDate(title) ||
    null;

  const bodyFromLd = typeof ld.body === "string" ? ld.body.trim() : "";
  const bodyFromDom = extractContent($);
  const content =
    bodyFromLd && bodyFromLd.length > 200 ? bodyFromLd : bodyFromDom;

  return {
    title: title.substring(0, 500),
    desc: desc.substring(0, 1000),
    img,
    published,
    content: content.substring(0, 5000),
  };
}

function buildQueryFromTitle(title) {
  if (!title) return "British Columbia government";

  const base = title
    .replace(/[""''"']/g, "")
    .replace(/[()]/g, " ")
    .replace(/\d{4}/g, "")
    .split(/\s+/)
    .filter(
      (w) =>
        w &&
        w.length > 2 &&
        !/^(the|a|an|of|to|in|for|on|and|or|with|by|from|at|as|is|are|will|new|task|force|into|over|underway|plan|plans|statement|program|project|update|people|opens|public|minister|province|process|water|government|announces|announcement)$/i.test(
          w
        )
    )
    .slice(0, 3)
    .join(" ");

  return `${base} British Columbia`.trim();
}

const unsplashCache = new Map();

async function findUnsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    console.log("No Unsplash API key provided, skipping API search");
    return null;
  }

  if (unsplashCache.has(query)) {
    console.log(`Using cached result for query: ${query}`);
    return unsplashCache.get(query);
  }

  try {
    console.log(`Searching Unsplash for: ${query}`);

    const res = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 3,
        orientation: "landscape",
        content_filter: "high",
      },
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
        "User-Agent": UA,
      },
      timeout: 15000,
    });

    console.log(`Unsplash API response status: ${res.status}`);
    console.log(`Unsplash results count: ${res?.data?.results?.length || 0}`);

    const photos = res?.data?.results;
    if (!photos || photos.length === 0) {
      console.log("No photos found from Unsplash API");
      unsplashCache.set(query, null);
      return null;
    }

    const photo = photos[0];
    console.log(`Selected photo ID: ${photo.id}`);

    const dl = photo?.links?.download_location;
    if (dl) {
      try {
        await axios.get(dl, {
          headers: { Authorization: `Client-ID ${key}` },
          timeout: 8000,
        });
        console.log("Download trigger successful");
      } catch (err) {
        console.warn("Download trigger failed:", err.message);
      }
    }

    const rawUrl =
      photo?.urls?.raw || photo?.urls?.full || photo?.urls?.regular;
    if (!rawUrl) {
      console.log("No valid image URL found in photo data");
      return null;
    }

    const heroUrl = `${rawUrl}&w=1600&h=900&q=80&auto=format&fit=crop`;
    console.log(`Generated hero URL: ${heroUrl}`);

    unsplashCache.set(query, heroUrl);
    return heroUrl;
  } catch (error) {
    console.warn("Unsplash API error:", error.message);
    if (error.response) {
      console.warn("Response status:", error.response.status);
      console.warn("Response data:", error.response.data);
    }

    unsplashCache.set(query, null);
    return null;
  }
}

async function fallbackRandom(query) {
  console.log(`Trying fallback random image for: ${query}`);

  const cleanQuery =
    query.replace(/British Columbia/gi, "").trim() || "government";
  const src = `https://source.unsplash.com/1600x900/?${encodeURIComponent(
    cleanQuery
  )}`;

  try {
    const r = await axios.head(src, {
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    console.log(`Fallback source response: ${r.status}`);

    if (r.request?.res?.responseUrl) {
      const finalUrl = r.request.res.responseUrl;
      console.log(`Fallback final URL: ${finalUrl}`);
      return finalUrl.includes("unsplash.com") ? finalUrl : FALLBACK_IMG;
    }

    return FALLBACK_IMG;
  } catch (error) {
    console.warn("Fallback random failed:", error.message);
    return FALLBACK_IMG;
  }
}

async function ensureHero(title, currentUrl) {
  if (
    currentUrl &&
    !/default-og-image/i.test(currentUrl) &&
    !isHandler(currentUrl, "") &&
    /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(currentUrl)
  ) {
    console.log(`Using existing image: ${currentUrl}`);
    return currentUrl;
  }

  const q = buildQueryFromTitle(title || "British Columbia government");
  console.log(`Building query from title "${title}" -> "${q}"`);

  const apiResult = await findUnsplash(q);
  if (apiResult) {
    console.log(`Using Unsplash API result: ${apiResult}`);
    return apiResult;
  }

  const fallbackResult = await fallbackRandom(q);
  console.log(`Using fallback result: ${fallbackResult}`);
  return fallbackResult;
}

async function collectLinksByClick(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);

  console.log("Starting to collect news links...");

  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(START, { waitUntil: "domcontentloaded", timeout: 60000 });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const seen = new Set();
  let clicks = 0;
  let emptyRounds = 0;

  async function grab() {
    try {
      const items = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/releases/"]');
        const result = [];
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          result.push({
            url: link.href,
            title: (link.textContent || "").trim(),
          });
        }
        return result;
      });

      const newItems = [];
      for (const it of items) {
        if (!it || !it.url) continue;
        if (!/\/releases\/[0-9A-Z-]+$/i.test(it.url)) continue;
        if (seen.has(it.url)) continue;
        seen.add(it.url);
        newItems.push(it);
        if (seen.size >= COUNT) break;
      }
      return newItems;
    } catch (error) {
      console.warn("Error in grab function:", error.message);
      return [];
    }
  }

  let collected = [];
  const initialItems = await grab();
  collected.push(...initialItems);
  console.log(`Initially collected ${collected.length} news items`);

  while (collected.length < COUNT && clicks < MAX_CLICKS) {
    try {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const prev = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/releases/"]');
        return links.length;
      });

      console.log(`Before click ${clicks + 1}: ${prev} total links found`);

      const clicked = await page.evaluate(async () => {
        const loadMoreSelectors = [
          'button[class*="load"]',
          'button[class*="more"]',
          'a[class*="load"]',
          'a[class*="more"]',
          ".load-more",
          ".show-more",
          ".btn-load-more",
          ".pagination-load-more",
          'button:contains("Load More")',
          'a:contains("Load More")',
          'button:contains("Show More")',
          'a:contains("Show More")',
          'button:contains("More")',
          '[data-action*="load"]',
          '[data-action*="more"]',
        ];

        const bcSpecificSelectors = [
          ".news-releases .load-more",
          ".news-listing .load-more",
          ".releases-container .load-more",
          'button[data-drupal-selector*="load"]',
          'button[data-drupal-selector*="more"]',
          ".view-news-releases .more-link",
          ".pager-load-more",
        ];

        const allSelectors = [...loadMoreSelectors, ...bcSpecificSelectors];

        let foundButton = null;

        for (const selector of allSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              if (
                el.offsetParent !== null &&
                !el.disabled &&
                !el.classList.contains("disabled")
              ) {
                foundButton = el;
                console.log(
                  `Found button with selector: ${selector}, text: "${el.textContent?.trim()}"`
                );
                break;
              }
            }
            if (foundButton) break;
          } catch (e) {
            continue;
          }
        }

        if (!foundButton) {
          const allClickables = document.querySelectorAll(
            'button, a, [role="button"], input[type="button"], input[type="submit"]'
          );

          for (const el of allClickables) {
            const text = (el.textContent || el.value || "")
              .toLowerCase()
              .trim();
            const title = (el.title || "").toLowerCase();
            const ariaLabel = (
              el.getAttribute("aria-label") || ""
            ).toLowerCase();

            if (
              text.includes("load more") ||
              text.includes("show more") ||
              text.includes("more releases") ||
              text.includes("view more") ||
              text.includes("load additional") ||
              title.includes("load more") ||
              title.includes("show more") ||
              ariaLabel.includes("load more") ||
              ariaLabel.includes("show more") ||
              (text === "more" && el.tagName.toLowerCase() === "button")
            ) {
              if (
                el.offsetParent !== null &&
                !el.disabled &&
                !el.classList.contains("disabled")
              ) {
                foundButton = el;
                console.log(
                  `Found button by text: "${text}", element: ${el.tagName}`
                );
                break;
              }
            }
          }
        }

        if (!foundButton) {
          const paginationLinks = document.querySelectorAll(
            '.pager a, .pagination a, [class*="pag"] a'
          );
          for (const link of paginationLinks) {
            const text = (link.textContent || "").trim().toLowerCase();
            const rel = (link.getAttribute("rel") || "").toLowerCase();

            if (
              text === "next" ||
              text === "다음" ||
              rel === "next" ||
              text.includes("next")
            ) {
              foundButton = link;
              console.log(
                `Found pagination next button: "${link.textContent?.trim()}"`
              );
              break;
            }
          }
        }

        if (!foundButton) {
          const allButtons = document.querySelectorAll(
            'button, a, [role="button"]'
          );
          console.log(`=== All ${allButtons.length} buttons/links on page ===`);
          for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
            const el = allButtons[i];
            console.log(
              `${i}: "${(el.textContent || "")
                .trim()
                .substring(0, 50)}" | class="${el.className}" | id="${el.id}"`
            );
          }
          console.log("No load more button found");
          return false;
        }

        console.log(
          `Clicking element: "${(
            foundButton.textContent ||
            foundButton.value ||
            ""
          ).trim()}"`
        );
        foundButton.scrollIntoView({ block: "center", behavior: "smooth" });

        await new Promise((resolve) => setTimeout(resolve, 500));

        foundButton.click();
        return true;
      });

      if (!clicked) {
        console.log("No more 'load more' button found");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 4000));

      const newCount = await page.evaluate((prevCount) => {
        const currentCount = document.querySelectorAll(
          'a[href*="/releases/"]'
        ).length;
        console.log(`Previous: ${prevCount}, Current: ${currentCount}`);
        return currentCount;
      }, prev);

      const newItems = await grab();
      collected.push(...newItems);
      clicks += 1;

      console.log(
        `Click ${clicks}: Found ${newItems.length} new items, total: ${collected.length} (page has ${newCount} total links)`
      );

      if (newItems.length === 0) {
        console.log("No new items found this round");
        if (++emptyRounds >= 3) {
          console.log("3 consecutive rounds with no new items, stopping");
          break;
        }
      } else {
        emptyRounds = 0;
      }
    } catch (error) {
      console.warn(`Error during click ${clicks + 1}:`, error.message);
      break;
    }
  }

  await page.close();
  console.log(
    `Final collection: ${Math.min(collected.length, COUNT)} news items`
  );
  return collected.slice(0, COUNT);
}

async function mapLimit(list, limit, fn) {
  const ret = new Array(list.length);
  let i = 0;

  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= list.length) break;
      try {
        ret[idx] = await fn(list[idx], idx);
        if ((idx + 1) % 5 === 0) {
          console.log(`Processed ${idx + 1}/${list.length} items`);
        }
      } catch (error) {
        console.error(`Error processing item ${idx}:`, error.message);
        ret[idx] = null;
      }
    }
  }

  const n = Math.max(1, Math.min(limit, list.length));
  await Promise.all(Array.from({ length: n }, worker));
  return ret.filter(Boolean);
}

async function main() {
  console.log(`Starting BC News Crawler - Target: ${COUNT} items`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=VizDisplayCompositor",
    ],
  });

  try {
    const index = await collectLinksByClick(browser);
    console.log(`\nProcessing ${index.length} news articles...`);

    const filled = await mapLimit(index, CONCURRENCY, async (row, idx) => {
      const page = await browser.newPage();
      try {
        console.log(`Processing ${idx + 1}/${index.length}: ${row.url}`);

        const html = await getRenderedHtml(page, row.url);
        const d = parseDetail(html, row.url, row.title);

        let hero = d.img;
        const finalHero = await ensureHero(d.title, hero);

        const result = {
          id: Buffer.from(row.url).toString("base64").replace(/=+$/, ""),
          title_en: d.title || row.title,
          summary_en: d.desc,
          url: row.url,
          hero_img: finalHero,
          published_at: d.published,
          content_en: d.content,
        };

        await page.close();
        return result;
      } catch (error) {
        console.error(`Error processing ${row.url}:`, error.message);
        await page.close();

        const finalHero = await ensureHero(row.title, null);
        return {
          id: Buffer.from(row.url).toString("base64").replace(/=+$/, ""),
          title_en: row.title,
          summary_en: "",
          url: row.url,
          hero_img: finalHero,
          published_at: null,
          content_en: "",
        };
      }
    });

    const outPath = path.join(process.cwd(), "mock", "crawled.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(filled.slice(0, COUNT), null, 2));

    console.log(
      `\n✅ Success! Wrote ${Math.min(
        filled.length,
        COUNT
      )} items to ${outPath}`
    );
    console.log(
      `Items with published_at: ${
        filled.filter((item) => item.published_at).length
      }`
    );
    console.log(
      `Items with custom images: ${
        filled.filter(
          (item) => item.hero_img && !item.hero_img.includes("unsplash")
        ).length
      }`
    );
    console.log(
      `Items with Unsplash images: ${
        filled.filter(
          (item) => item.hero_img && item.hero_img.includes("unsplash")
        ).length
      }`
    );
  } catch (error) {
    console.error("Main execution error:", error);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
