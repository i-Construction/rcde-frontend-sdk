import { Box, Typography } from "@mui/material";
import { FC, ReactNode } from "react";
import { ContractFile } from "../contexts/contractFiles";
import type { PendingUploads } from "../lib/contractFileStatus";
import { ContractFileList } from "./right/ContractFileList";

export type LeftSiderProps = {
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
  pendingUploads: PendingUploads;
  headerActions?: ReactNode;
};

const LEFT_SIDER_WIDTH = 320;

const LeftSider: FC<LeftSiderProps> = ({
  onFileFocus,
  onFileDelete,
  pendingUploads,
  headerActions,
}) => {
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
        {headerActions}
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 1 }}>
        <ContractFileList
          onFileFocus={onFileFocus}
          onFileDelete={onFileDelete}
          pendingUploads={pendingUploads}
        />
      </Box>
    </Box>
  );
};

export { LeftSider };
