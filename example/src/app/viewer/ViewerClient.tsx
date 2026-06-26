"use client";

import { RCDE, type PendingUploads, type RCDEAppConfig } from "@i-con/frontend-sdk";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Box, Button } from "@mui/material";
import { useCallback, useState } from "react";
import { ViewerHeader } from "@/components/ViewerHeader";
import { FileUploadModal } from "@/components/FileUploadModal";

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
  const [pendingUploads, setPendingUploads] = useState<PendingUploads>({});
  const [contractFilesRefetchKey, setContractFilesRefetchKey] = useState<number | undefined>(
    undefined
  );

  const app: RCDEAppConfig = {
    token,
    // ブラウザから RCDE API への直接呼び出しは CORS で POST 等が失敗するためプロキシ経由
    baseUrl: "/api/rcde",
    authType: "2legged",
  };

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
        <RCDE
          app={app}
          constructionId={constructionId}
          contractId={contractId}
          pendingUploads={pendingUploads}
          contractFilesRefetchKey={contractFilesRefetchKey}
          leftSiderHeaderActions={
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={handleUploadOpen}
            >
              アップロード
            </Button>
          }
          auxiliaryContent={
            <FileUploadModal
              contractId={contractId}
              open={isUploadOpen}
              onClose={handleUploadClose}
              onUploaded={handleUploaded}
              onUploadStarted={handleUploadStarted}
              onUploadFinished={handleUploadFinished}
            />
          }
        />
      </Box>
    </Box>
  );
}
