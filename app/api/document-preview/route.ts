import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED_HOSTS = new Set(["res.cloudinary.com"]);

const isAllowedPreviewUrl = (url: URL, req: Request) => {
  const requestOrigin = new URL(req.url).origin;
  return url.origin === requestOrigin || ALLOWED_HOSTS.has(url.hostname);
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedPreviewUrl(sourceUrl, req)) {
    return NextResponse.json({ error: "Preview host is not allowed" }, { status: 400 });
  }

  const sourceRes = await fetch(sourceUrl.toString(), { cache: "no-store" });
  if (!sourceRes.ok || !sourceRes.body) {
    return NextResponse.json({ error: "Unable to load document" }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", sourceRes.headers.get("content-type") || "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  const contentLength = sourceRes.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(sourceRes.body, { status: 200, headers });
}
