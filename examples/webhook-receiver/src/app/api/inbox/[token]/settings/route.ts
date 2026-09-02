import { NextResponse } from "next/server";
import { isInboxTokenValid } from "@/lib/auth";
import { getSettings, setSettings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  return NextResponse.json(getSettings(token));
}

export async function PUT(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isInboxTokenValid(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }
  const body = (await request.json()) as { status?: unknown; delayMs?: unknown };
  const status =
    body.status === 200 || body.status === 400 || body.status === 500 ? body.status : undefined;
  const delayMs = typeof body.delayMs === "number" ? body.delayMs : undefined;
  return NextResponse.json(setSettings(token, { status, delayMs }));
}
