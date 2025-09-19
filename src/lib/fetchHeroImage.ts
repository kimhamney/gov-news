import * as cheerio from "cheerio";

export async function fetchHeroImage(
  url: string,
  timeoutMs = 6000
): Promise<string | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const get = (sel: string, attr: "content" | "src" = "content") =>
      $(sel).attr(attr);

    const metaOg = get('meta[property="og:image"]');
    if (metaOg) return new URL(metaOg, url).toString();

    const metaTw = get('meta[name="twitter:image"]');
    if (metaTw) return new URL(metaTw, url).toString();

    const firstImg = $("article img, main img, figure img, .media img, img")
      .first()
      .attr("src");
    if (firstImg) return new URL(firstImg, url).toString();

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
