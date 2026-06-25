import { NextResponse } from "next/server";
import { authenticate2Legged } from "@/lib/rcde-auth-login";
import { getStoredToken } from "@/lib/auth-store";

/**
 * 2-legged 認証: clientSecret でトークン取得
 * POST /api/auth/token
 */
export async function POST() {
  try {
    await authenticate2Legged();
    const tokenData = await getStoredToken();
    if (tokenData === undefined) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

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
