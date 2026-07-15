import { NextRequest, NextResponse } from "next/server";
import { create2LeggedClient } from "@/lib/rcde-server";
import { extractBearerToken } from "@/lib/request-auth";

/**
 * GET /api/constructions - 現場一覧・契約一覧プロキシ
 * ?constructionId=123 を付けると、そのconstruction配下の契約一覧を返す
 *
 * standalone 型: クライアントが送る Authorization: Bearer をそのまま使って RCDE API を呼ぶ。
 */
export async function GET(request: NextRequest) {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const constructionId = request.nextUrl.searchParams.get("constructionId");

  try {
    const client = create2LeggedClient();
    client.setAccessToken(accessToken);

    if (constructionId) {
      const contractListResult = await client.getContractList({
        constructionId: Number(constructionId),
      });
      return NextResponse.json({ contracts: contractListResult.contracts ?? [] });
    }

    const constructionListResult = await client.getConstructionList();
    return NextResponse.json({ constructions: constructionListResult.constructions ?? [] });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const detail = JSON.stringify(error);
    return NextResponse.json({ error: `データ取得に失敗しました: ${detail}` }, { status: 500 });
  }
}
