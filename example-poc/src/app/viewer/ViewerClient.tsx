"use client";

import { RCDE, type RCDEAppConfig } from "@i-con/frontend-sdk";

type ViewerClientProps = {
  token: string;
  constructionId: number;
  contractId: number;
  authType: "2legged" | "3legged";
  constructionName?: string;
  contractName?: string;
};

export function ViewerClient({
  token,
  constructionId,
  contractId,
  authType,
  constructionName,
  contractName,
}: ViewerClientProps) {
  const app: RCDEAppConfig = {
    token,
    baseUrl: process.env.NEXT_PUBLIC_RCDE_API_BASE_URL ?? "https://api.rcde.jp",
    authType,
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <RCDE
        app={app}
        constructionId={constructionId}
        contractId={contractId}
        constructionName={constructionName}
        contractName={contractName}
      />
    </div>
  );
}
