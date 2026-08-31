"use client";

import {
  useContractFileActions,
  type ContractFile,
  type PendingUploads,
} from "@i-con/frontend-sdk";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Box, Button, Chip, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useCallback, useState, type ReactNode } from "react";

const SIDEBAR_WIDTH = 320;

const ICON_BUTTON_SX = {
  width: 28,
  height: 28,
  opacity: 0.7,
  "&:hover": { opacity: 1 },
  "&.Mui-disabled": { opacity: 0.3 },
};

type FileRowProps = {
  filename: string;
  uploadStatus: string;
  pclodStatus: string;
  isPclodDone: boolean;
  isVisible: boolean;
  disabled?: boolean;
  onVisibilityToggle?: () => void;
  onFocus?: () => void;
  onMenuOpen?: (el: HTMLElement) => void;
};

function FileRow({
  filename,
  uploadStatus,
  pclodStatus,
  isPclodDone,
  isVisible,
  disabled = false,
  onVisibilityToggle,
  onFocus,
  onMenuOpen,
}: FileRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        py: 0.5,
        px: 0.5,
        borderRadius: 1,
        opacity: isVisible ? 1 : 0.6,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          title={filename}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {filename}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
          <Chip
            label={`アップロード: ${uploadStatus}`}
            size="small"
            sx={{ height: 18, fontSize: 10 }}
          />
          <Chip label={`PCLOD: ${pclodStatus}`} size="small" sx={{ height: 18, fontSize: 10 }} />
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
        <Tooltip title={isVisible ? "非表示にする" : "表示する"} disableInteractive>
          <span>
            <IconButton
              size="small"
              sx={ICON_BUTTON_SX}
              disabled={disabled || !isPclodDone}
              onClick={onVisibilityToggle}
            >
              {isVisible ? (
                <VisibilityIcon sx={{ fontSize: 16 }} />
              ) : (
                <VisibilityOffIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="フォーカスする" disableInteractive>
          <span>
            <IconButton
              size="small"
              sx={ICON_BUTTON_SX}
              disabled={disabled || !isPclodDone || !isVisible}
              onClick={onFocus}
            >
              <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="その他" disableInteractive>
          <span>
            <IconButton
              size="small"
              sx={ICON_BUTTON_SX}
              disabled={disabled}
              onClick={(e) => onMenuOpen?.(e.currentTarget)}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

type ContractFileSidebarProps = {
  pendingUploads: PendingUploads;
  headerActions?: ReactNode;
};

/**
 * SDK の useContractFileActions フックを使って自作したファイル一覧パネル。
 * RCDE のプロバイダ配下（auxiliaryContent など）に置くこと。
 */
export function ContractFileSidebar({ pendingUploads, headerActions }: ContractFileSidebarProps) {
  const { rows, toggleVisibility, focusFile, downloadFile, getFileStatus, isPclodCompleted } =
    useContractFileActions(pendingUploads);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuFile, setMenuFile] = useState<ContractFile | undefined>(undefined);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuFile(undefined);
  }, []);

  const handleDownload = useCallback(() => {
    if (menuFile !== undefined) {
      void downloadFile(menuFile);
    }
    handleMenuClose();
  }, [menuFile, downloadFile, handleMenuClose]);

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        zIndex: 10,
        pointerEvents: "auto",
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
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
            ファイルがありません
          </Typography>
        ) : (
          rows.map((row) => {
            if (row.type === "pending") {
              return (
                <FileRow
                  key={`pending-${row.contractFileId}`}
                  filename={row.name}
                  uploadStatus="アップロード中"
                  pclodStatus="-"
                  isPclodDone={false}
                  isVisible={false}
                  disabled
                />
              );
            }

            const { file, visible } = row.container;
            const status = getFileStatus(file);
            const pclodDone = isPclodCompleted(file);

            return (
              <FileRow
                key={file.id}
                filename={file.name}
                uploadStatus={status.upload}
                pclodStatus={status.pclod}
                isPclodDone={pclodDone}
                isVisible={visible}
                onVisibilityToggle={() => toggleVisibility(row.container)}
                onFocus={() => void focusFile(file)}
                onMenuOpen={(el) => {
                  setMenuAnchor(el);
                  setMenuFile(file);
                }}
              />
            );
          })
        )}
      </Box>

      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={handleMenuClose}>
        <MenuItem onClick={handleDownload}>ダウンロード</MenuItem>
      </Menu>
    </Box>
  );
}

/** サイドバーヘッダーに置くアップロードボタン */
export function SidebarUploadButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="small" variant="outlined" startIcon={<UploadFileIcon />} onClick={onClick}>
      アップロード
    </Button>
  );
}
