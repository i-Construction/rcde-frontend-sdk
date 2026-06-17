import { NextResponse } from "next/server";
import { create2LeggedClient } from "@/lib/rcde-server";
import { storeToken } from "@/lib/auth-store";

/**
 * 2-legged 認証: clientSecret でトークン取得
 * POST /api/auth/token
 */
export async function POST() {
  try {
    const client = create2LeggedClient();
    await client.authenticate();

    const tokenData = {
      accessToken: (client as any).token?.accessToken ?? "",
      refreshToken: (client as any).token?.refreshToken ?? "",
      expiresAt: (client as any).token?.expiresAt ?? 0,
    };

    await storeToken(tokenData);

    return NextResponse.json({
      accessToken: tokenData.accessToken,
      authType: "2legged" as const,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
