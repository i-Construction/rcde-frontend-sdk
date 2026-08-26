import { redirect } from "next/navigation";
import { getStoredToken } from "@/lib/auth-store";
import { isExpiringSoon } from "@/lib/rcde-auth-common";
import { create2LeggedClient } from "@/lib/rcde-server";
import { ConstructionSelector } from "@/components/ConstructionSelector";
import { ViewerClientLoader } from "./ViewerClientLoader";

type SearchParams = {
  constructionId?: string;
  contractId?: string;
  constructionName?: string;
  contractName?: string;
};

/**
 * URLに名前が含まれない場合（手動IDまたはブックマーク経由）は
 * 2-legged APIで現場・契約名をサーバーサイドで取得する。
 */
async function resolveNames(
  accessToken: string,
  constructionId: number,
  contractId: number,
  constructionNameFromUrl: string | undefined,
  contractNameFromUrl: string | undefined
): Promise<{ constructionName: string | undefined; contractName: string | undefined }> {
  const needsFetch = !constructionNameFromUrl || !contractNameFromUrl;
  if (!needsFetch) {
    return {
      constructionName: constructionNameFromUrl,
      contractName: contractNameFromUrl,
    };
  }

  try {
    const client = create2LeggedClient();
    client.setAccessToken(accessToken);

    const [constructionRes, contractRes] = await Promise.all([
      constructionNameFromUrl
        ? Promise.resolve({ name: constructionNameFromUrl })
        : client.getConstruction(constructionId),
      contractNameFromUrl
        ? Promise.resolve({ name: contractNameFromUrl })
        : client.getContract(contractId),
    ]);

    return {
      constructionName: constructionRes.name,
      contractName: contractRes.name,
    };
  } catch {
    return {
      constructionName: constructionNameFromUrl,
      contractName: contractNameFromUrl,
    };
  }
}

export default async function ViewerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const token = await getStoredToken();
  if (!token) {
    redirect("/api/auth/login");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (isExpiringSoon(token.expiresAt, nowSec)) {
    // Route Handler 経由で silent refresh → /viewer へ戻る
    redirect("/api/auth/login");
  }

  const params = await searchParams;
  const constructionId = params.constructionId ? Number(params.constructionId) : 0;
  const contractId = params.contractId ? Number(params.contractId) : 0;

  const hasIds = constructionId > 0 && contractId > 0;
  if (!hasIds) {
    return <ConstructionSelector accessToken={token.accessToken} />;
  }

  const { constructionName, contractName } = await resolveNames(
    token.accessToken,
    constructionId,
    contractId,
    params.constructionName,
    params.contractName
  );

  return (
    <ViewerClientLoader
      token={token.accessToken}
      constructionId={constructionId}
      contractId={contractId}
      constructionName={constructionName}
      contractName={contractName}
    />
  );
}
