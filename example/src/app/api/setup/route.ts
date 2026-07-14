import { NextResponse } from "next/server";
import { create2LeggedClient } from "@/lib/rcde-server";
import { getStoredToken } from "@/lib/auth-store";

/**
 * POST /api/setup
 * 2-legged API でテスト用の現場と契約を自動作成する。
 * バックエンド側で受注者はダミーユーザーが自動設定され、承認も自動で完了するため、
 * 2つ目のアカウントや手動承認は不要。
 */
export async function POST() {
  const token = await getStoredToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = create2LeggedClient();
    await client.authenticate();

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
