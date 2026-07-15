import { NextResponse } from "next/server";
import { create2LeggedClient, resolveAccessToken } from "@/lib/rcde-server";

/**
 * POST /api/setup
 * 2-legged API でテスト用の現場と契約を自動作成する。
 * バックエンド側で受注者はダミーユーザーが自動設定され、承認も自動で完了するため、
 * 2つ目のアカウントや手動承認は不要。
 *
 * `resolveAccessToken` で Cookie の保存済みトークンを再利用・必要なら更新し、
 * 更新結果を Cookie に反映する。素の `client.authenticate()` を都度呼ぶと
 * 新規トークンが Cookie に保存されず、以降の一覧取得・viewer 入場が
 * 古いトークンのまま失敗する不整合が起きるため避ける。
 */
export async function POST() {
  const accessToken = await resolveAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = create2LeggedClient();
    client.setAccessToken(accessToken);

    const now = new Date();
    const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const construction = await client.createConstruction({
      name: `PoC テスト現場 (${now.toLocaleDateString("ja-JP")})`,
      address: "テスト住所",
      contractedAt: now,
      period: oneYearLater,
      advancePaymentRate: 1,
      contractAmount: 1,
    });

    const constructionId = construction.id;
    if (!constructionId) {
      return NextResponse.json(
        { error: "現場の作成に失敗しました（ID が取得できません）" },
        { status: 500 }
      );
    }

    const contract = await client.createContract({
      constructionId,
      name: `PoC テスト契約 (${now.toLocaleDateString("ja-JP")})`,
      contractedAt: now,
      unitPrice: 1,
      unitVolume: 1,
    });

    return NextResponse.json({
      construction,
      contract,
      message: "テスト用の現場と契約を作成しました",
    });
  } catch (error) {
    // fetch ベースのクライアントは HttpResponse オブジェクトを throw するため、
    // Error インスタンス以外のケースも詳細を返す
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (
      error !== null &&
      typeof error === "object" &&
      "error" in error &&
      typeof (error as Record<string, unknown>).error === "object"
    ) {
      const detail = JSON.stringify((error as Record<string, unknown>).error);
      return NextResponse.json({ error: `RCDE API エラー: ${detail}` }, { status: 500 });
    }
    const detail = JSON.stringify(error);
    return NextResponse.json({ error: `セットアップに失敗しました: ${detail}` }, { status: 500 });
  }
}
