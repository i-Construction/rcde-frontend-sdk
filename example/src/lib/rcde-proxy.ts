import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/request-auth";

const RCDE_API_BASE_URL = process.env.RCDE_API_BASE_URL ?? "https://api.rcde.jp";

/**
 * ブラウザ → RCDE API の CORS 回避用プロキシ。
 * SDK の RCDEClient が baseUrl="/api/rcde" で呼び出し、`app.token` から組み立てた
 * Authorization: Bearer をそのまま upstream へ転送する（standalone 型）。
 */
export async function proxyToRcdeApi(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetPath = pathSegments.join("/");
  const url = `${RCDE_API_BASE_URL}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("Accept", accept);
  }

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
