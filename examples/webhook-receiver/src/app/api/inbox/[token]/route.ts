import { NextResponse } from "next/server";
import { isInboxTokenValid } from "@/lib/auth";
import {
  COMPLETED_TYPE,
  SIGNATURE_HEADER_NAMES,
  headerEventId,
  parseEnvelope,
} from "@/lib/envelope";
import { getSettings, rememberEvent } from "@/lib/store";

export const runtime = "nodejs";

// 保存したヘッダーは GET /events と SSE でそのまま返る。送信元が付けた
// Authorization や Cookie を読めてしまわないよう、画面と整合チェックで
// 使う分だけ残す。
const STORED_HEADER_NAMES = [
  "x-rcde-event-id",
  "content-type",
  "user-agent",
  ...SIGNATURE_HEADER_NAMES,
];

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of STORED_HEADER_NAMES) {
    const headerValue = headers.get(name);
    if (headerValue !== null) {
      out[name] = headerValue;
    }
  }
  return out;
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const settings = getSettings(token);
  await sleep(settings.delayMs);

  const rawBody = await request.text();
  let parsedJson: unknown = null;
  try {
    parsedJson = rawBody === "" ? null : JSON.parse(rawBody);
  } catch {
    parsedJson = null;
  }
  const parsed = parseEnvelope(parsedJson);
  const eventId = headerEventId(request.headers) ?? parsed?.id ?? null;
  const type = parsed?.type ?? null;
  const ignoredType = type !== COMPLETED_TYPE;
  const path = new URL(request.url).pathname;

  const stored = rememberEvent(token, {
    receivedAt: new Date().toISOString(),
    method: request.method,
    path,
    headers: headersToRecord(request.headers),
    rawBody,
    parsed,
    eventId,
    ignoredType,
  });

  console.log("[inbox] received", {
    token,
    seq: stored.seq,
    eventId,
    type,
    ignoredType,
    duplicate: stored.duplicate,
    path,
  });

  const status = ignoredType ? 200 : settings.status;
  return NextResponse.json({ ok: true, ignoredType }, { status });
}
