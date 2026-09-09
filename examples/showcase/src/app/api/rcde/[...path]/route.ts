import { NextRequest, NextResponse } from "next/server";
import { getRcdeApiBaseUrl } from "@/lib/rcde-2legged";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * ブラウザ → RCDE API の CORS 回避用プロキシ。
 *
 * SDK の `RCDEClient` は `app.baseUrl`（= `/api/rcde`）に対して
 * `/ext/v2/authenticated/...` を組み立てて呼ぶため、そのパスをそのまま upstream へ転送する。
 * Authorization ヘッダーはブラウザから届いたものを転送する（`app.token` の値）。
 */
async function handle(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Authorization ヘッダーがありません" }, { status: 401 });
  }

  const url = `${getRcdeApiBaseUrl()}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", authorization);
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
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }
  responseHeaders.set("Cache-Control", "no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
