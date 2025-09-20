import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  if (typeof window !== "undefined") return "";

  const h = await headers();

  const proto =
    h.get("x-forwarded-proto") ?? (process.env.VERCEL ? "https" : "http");

  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";

  return `${proto}://${host}`;
}

export function getBaseUrlFromRequest(req?: Request): string {
  if (typeof window !== "undefined") return "";
  if (req) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  }
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}
