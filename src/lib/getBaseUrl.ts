import { headers } from "next/headers";

export async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protoHeader = h.get("x-forwarded-proto") ?? "";
  const protocol = protoHeader.includes("https") ? "https" : "http";
  if (!host) {
    return "http://localhost:3000";
  }
  return `${protocol}://${host}`;
}
