import { NextResponse } from "next/server";
import { getStoredToken } from "@/lib/auth-store";
import { authenticate2Legged } from "@/lib/rcde-auth-login";

/**
 * 2-legged 認証を実行し Cookie を設定して /viewer へリダイレクトする。
 * GET /api/auth/login
 */
export async function GET(request: Request) {
  const existing = await getStoredToken();
  if (existing) {
    return NextResponse.redirect(new URL("/viewer", request.url));
  }

  try {
    await authenticate2Legged();
    return NextResponse.redirect(new URL("/viewer", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }
}
