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
}: ViewerClientProps) {
  const app: RCDEAppConfig = {
    token,
    // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
    baseUrl: "/api/rcde",
    authType,
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <RCDE
        app={app}
        constructionId={constructionId}
        contractId={contractId}
      />
    </div>
  );
}
