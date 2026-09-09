import { NextResponse } from "next/server";
import { MissingRcdeCredentialsError, getAccessToken } from "@/lib/rcde-2legged";

export const dynamic = "force-dynamic";

/**
 * SDK の `app.token` に渡すアクセストークンをブラウザへ返す。
 *
 * 2-legged トークンはアプリ単位の権限を持つため、本番アプリでは
 * 「トークンをブラウザに渡さず、プロキシ側で Authorization を注入する」構成か、
 * ユーザー単位の 3-legged 認証を検討すること（README の注意事項を参照）。
 */
export async function GET() {
  try {
    const token = await getAccessToken();
    return NextResponse.json(
      {
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof MissingRcdeCredentialsError) {
      return NextResponse.json(
        { error: error.message, code: "MISSING_CREDENTIALS" },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
