import { NextResponse } from "next/server";
import { isInboxTokenValid } from "@/lib/auth";
import { listEvents, removeEvent } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  return NextResponse.json({ events: listEvents(token) });
}

export async function DELETE(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  const seq = Number(new URL(request.url).searchParams.get("seq"));
  if (!Number.isInteger(seq) || seq < 1) {
    return NextResponse.json({ error: "invalid seq" }, { status: 400 });
  }
  if (!removeEvent(token, seq)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
