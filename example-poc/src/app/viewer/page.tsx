import { redirect } from "next/navigation";
import { getStoredToken } from "@/lib/auth-store";
import { create2LeggedClient, getAuthType } from "@/lib/rcde-server";
import { ViewerClient } from "./ViewerClient";
import { ConstructionSelector } from "@/components/ConstructionSelector";

type SearchParams = {
  constructionId?: string;
  contractId?: string;
  constructionName?: string;
  contractName?: string;
};

/**
 * URLに名前が含まれない場合（手動IDまたはブックマーク経由）は
 * 2-legged APIで現場・契約名をサーバーサイドで取得する
 */
async function resolveNames(
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
    await client.authenticate();

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
    redirect("/login");
  }

  const params = await searchParams;
  const constructionId = params.constructionId
    ? Number(params.constructionId)
    : 0;
  const contractId = params.contractId ? Number(params.contractId) : 0;

  const authType = getAuthType();

  const hasIds = constructionId > 0 && contractId > 0;
  if (!hasIds) {
    return (
      <ConstructionSelector
        accessToken={token.accessToken}
        authType={authType}
      />
    );
  }

  const { constructionName, contractName } = await resolveNames(
    constructionId,
    contractId,
    params.constructionName,
    params.contractName
  );

  return (
    <ViewerClient
      token={token.accessToken}
      constructionId={constructionId}
      contractId={contractId}
      authType={authType}
      constructionName={constructionName}
      contractName={contractName}
    />
  );
}
