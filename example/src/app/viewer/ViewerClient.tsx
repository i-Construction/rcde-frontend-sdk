"use client";

import { RCDE, type PendingUploads, type RCDEAppConfig } from "@i-con/frontend-sdk";
import { Box } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

import { ContractFileSidebar, SidebarUploadButton } from "@/components/ContractFileSidebar";
import { FileUploadModal } from "@/components/FileUploadModal";
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReferencePointDialogOpen, setIsReferencePointDialogOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUploads>({});
  const [contractFilesRefetchKey, setContractFilesRefetchKey] = useState<number | undefined>(
    undefined
  );

  // 基準点ダイアログの開閉などで ViewerClient が再レンダーされても、
  // token が変わらない限り app オブジェクトの参照を保つ。
  // 参照が変わるたびに Viewer 側で RCDEClient が再生成され、
  // ファイル一覧が再取得されて表示状態がリセットされてしまうため。
  const app: RCDEAppConfig = useMemo(
    () => ({
      token,
      // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
      baseUrl: "/api/rcde",
      authType: "2legged",
    }),
    [token]
  );

  const handleUploadOpen = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleUploadClose = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadStarted = useCallback(
    ({ contractFileId, name }: { contractFileId: number; name: string }) => {
      setPendingUploads((prev) => ({
        ...prev,
        [contractFileId]: { name },
      }));
    },
    []
  );

  const handleUploadFinished = useCallback((contractFileId: number) => {
    setPendingUploads((prev) => {
      const next = { ...prev };
      delete next[contractFileId];
      return next;
    });
  }, []);

  const handleUploaded = useCallback(() => {
    setContractFilesRefetchKey((prev) => (prev === undefined ? 1 : prev + 1));
    handleUploadClose();
  }, [handleUploadClose]);

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
        accessToken={token}
        constructionId={constructionId}
        contractId={contractId}
        constructionName={constructionName}
        contractName={contractName}
      />
      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <RCDE
          app={app}
          constructionId={constructionId}
          contractId={contractId}
          // デフォルトで全点群ファイルを非表示にする（空配列 = 表示対象なし）
          contractFileIds={[]}
          pendingUploads={pendingUploads}
          contractFilesRefetchKey={contractFilesRefetchKey}
          auxiliaryContent={
            <>
              <ContractFileSidebar
                pendingUploads={pendingUploads}
                headerActions={<SidebarUploadButton onClick={handleUploadOpen} />}
              />
              <FileUploadModal
                contractId={contractId}
                open={isUploadOpen}
                onClose={handleUploadClose}
                onUploaded={handleUploaded}
                onUploadStarted={handleUploadStarted}
                onUploadFinished={handleUploadFinished}
              />
              <ReferencePointDialog
                open={isReferencePointDialogOpen}
                onClose={handleReferencePointDialogClose}
              />
            </>
          }
        />
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
