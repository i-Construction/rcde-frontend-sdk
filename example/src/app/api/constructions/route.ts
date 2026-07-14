import { NextRequest, NextResponse } from "next/server";
import { create2LeggedClient } from "@/lib/rcde-server";
import { getStoredToken } from "@/lib/auth-store";

/**
 * GET /api/constructions - 現場一覧・契約一覧プロキシ
 * ?constructionId=123 を付けると、そのconstruction配下の契約一覧を返す
 */
export async function GET(request: NextRequest) {
  const token = await getStoredToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const constructionId = request.nextUrl.searchParams.get("constructionId");

  try {
    const client = create2LeggedClient();
    await client.authenticate();

    if (constructionId) {
      const result = await client.getContractList({
        constructionId: Number(constructionId),
      });
      return NextResponse.json({ contracts: result.contracts ?? [] });
    }

    const result = await client.getConstructionList();
    return NextResponse.json({ constructions: result.constructions ?? [] });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const detail = JSON.stringify(error);
    return NextResponse.json({ error: `データ取得に失敗しました: ${detail}` }, { status: 500 });
  }
}
