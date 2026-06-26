"use client";

import { RCDE, type RCDEAppConfig } from "@i-con/frontend-sdk";
import { Box } from "@mui/material";
import { useCallback, useState } from "react";

import { ReferencePointBridgeHandler } from "@/components/ReferencePointBridgeHandler";
import { ReferencePointDialog } from "@/components/ReferencePointDialog";
import { ViewerBottomToolbar } from "@/components/ViewerBottomToolbar";
import { ViewerHeader } from "@/components/ViewerHeader";

/** SDK の ReferencePointView より上にツールバーを置くオフセット（px） */
const VIEWER_TOOLBAR_BOTTOM_OFFSET = 48;

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
  const [isReferencePointDialogOpen, setIsReferencePointDialogOpen] = useState(false);

  const app: RCDEAppConfig = {
    token,
    // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
    baseUrl: "/api/rcde",
    authType: "2legged",
  };

  const handleReferencePointToolbarClick = useCallback(() => {
    setIsReferencePointDialogOpen(true);
  }, []);

  const handleReferencePointDialogClose = useCallback(() => {
    setIsReferencePointDialogOpen(false);
  }, []);

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
      <ReferencePointDialog
        open={isReferencePointDialogOpen}
        onClose={handleReferencePointDialogClose}
      />
      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <RCDE app={app} constructionId={constructionId} contractId={contractId}>
          <ReferencePointBridgeHandler />
        </RCDE>
        <Box
          sx={{
            position: "absolute",
            bottom: VIEWER_TOOLBAR_BOTTOM_OFFSET,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <ViewerBottomToolbar
            isReferencePointActive={isReferencePointDialogOpen}
            onReferencePointClick={handleReferencePointToolbarClick}
          />
        </Box>
      </Box>
    </Box>
  );
}
