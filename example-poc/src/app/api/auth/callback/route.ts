import { NextRequest, NextResponse } from "next/server";
import { create3LeggedClient } from "@/lib/rcde-server";
import { storeToken } from "@/lib/auth-store";

/**
 * 3-legged 認証: authorization_code → token 交換
 * GET /api/auth/callback?code=xxx
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  try {
    const client = create3LeggedClient();
    await client.authenticate(code);
    const token = client.getToken();

    await storeToken(token);

    return NextResponse.redirect(new URL("/viewer", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
