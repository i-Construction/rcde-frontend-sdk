import { UploadFile } from "@mui/icons-material";
import { Box, Button, Divider, Typography } from "@mui/material";
import { FC, useCallback, useState } from "react";
import { ContractFile } from "../contexts/contractFiles";
import type { PendingUploads } from "../lib/contractFileStatus";
import type { RCDEClient } from "../lib/rcde-client";
import { ContractFileList } from "./right/ContractFileList";
import { FileUploadModal } from "./FileUploadModal";

export type LeftSiderProps = {
  contractId: number;
  onUploaded?: (res: Awaited<ReturnType<RCDEClient["uploadContractFile"]>>) => void;
  onUploadStarted?: (params: { contractFileId: number; name: string }) => void;
  onUploadFinished?: (contractFileId: number) => void;
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
  pendingUploads: PendingUploads;
};

const LEFT_SIDER_WIDTH = 320;

const LeftSider: FC<LeftSiderProps> = ({
  contractId,
  onUploaded,
  onUploadStarted,
  onUploadFinished,
  onFileFocus,
  onFileDelete,
  pendingUploads,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUploadClose = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadOpen = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleUploaded = useCallback(
    (res: Awaited<ReturnType<RCDEClient["uploadContractFile"]>>) => {
      onUploaded?.(res);
      handleUploadClose();
    },
    [onUploaded, handleUploadClose]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: `0 0 ${LEFT_SIDER_WIDTH}px`,
        width: LEFT_SIDER_WIDTH,
        height: "100%",
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          ファイル
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UploadFile />}
          onClick={handleUploadOpen}
        >
          アップロード
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1 }}>
        <ContractFileList
          onFileFocus={onFileFocus}
          onFileDelete={onFileDelete}
          pendingUploads={pendingUploads}
        />
      </Box>

      <Divider />

      <FileUploadModal
        contractId={contractId}
        open={isUploadOpen}
        onUploaded={handleUploaded}
        onUploadStarted={onUploadStarted}
        onUploadFinished={onUploadFinished}
        onClose={handleUploadClose}
      />
    </Box>
  );
};

export { LeftSider };
