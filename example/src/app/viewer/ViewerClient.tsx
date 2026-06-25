"use client";

import { RCDE, type RCDEAppConfig } from "@i-con/frontend-sdk";
import { Box } from "@mui/material";
import { ViewerHeader } from "@/components/ViewerHeader";

type ViewerClientProps = {
  token: string;
  constructionId: number;
  contractId: number;
  constructionName?: string;
  contractName?: string;
};

export function ViewerClient({
  token,
  constructionId,
  contractId,
  constructionName,
  contractName,
}: ViewerClientProps) {
  const app: RCDEAppConfig = {
    token,
    // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
    baseUrl: "/api/rcde",
    authType: "2legged",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <ViewerHeader
        constructionId={constructionId}
        contractId={contractId}
        constructionName={constructionName}
        contractName={contractName}
      />
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <RCDE app={app} constructionId={constructionId} contractId={contractId} />
      </Box>
    </Box>
  );
}
