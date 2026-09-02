"use client";

import {
  useContractFileActions,
  type ContractFile,
  type ContractFileRow,
  type FileStatusLabels,
  type PclodStatusLabel,
  type PendingUploads,
  type UploadStatusLabel,
} from "@i-con/frontend-sdk";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ScheduleIcon from "@mui/icons-material/Schedule";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, type ReactNode } from "react";

export const CONTRACT_FILE_SIDEBAR_WIDTH = 320;
const SIDEBAR_WIDTH = CONTRACT_FILE_SIDEBAR_WIDTH;
const STATUS_ICON_SIZE = 16;
const POPOVER_BG = "#111827";
const LABEL_CHIP_BG = "#808000";

/** 進行中アイコンの回転。keyframes を 1 つに保つためアイコン間で共有する */
const SPIN_SX = {
  animation: "sidebarStatusSpin 1s linear infinite",
  "@keyframes sidebarStatusSpin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
};

const ICON_BUTTON_SX = {
  width: 28,
  height: 28,
  opacity: 0.7,
  "&:hover": { opacity: 1 },
  "&.Mui-disabled": { opacity: 0.3 },
};

type StatusRowKind = "uploading" | "waiting" | "processing" | "completed" | "unknown" | "idle";

/** ラベルは描画時に rows から引き直すため、state にはキーとアンカーだけ持つ */
type HoveredFileStatus = {
  rowKey: string;
  anchorEl: HTMLElement;
};

function rowKeyOf(row: ContractFileRow): string {
  return row.type === "pending" ? `pending-${row.contractFileId}` : String(row.container.file.id);
}

function findRowStatus(
  rows: ContractFileRow[],
  rowKey: string,
  getFileStatus: (file: ContractFile) => FileStatusLabels
): FileStatusLabels | null {
  const row = rows.find((candidate) => rowKeyOf(candidate) === rowKey);

  if (row === undefined) {
    return null;
  }

  if (row.type === "pending") {
    return { upload: "アップロード中", pclod: "-" };
  }

  return getFileStatus(row.container.file);
}

function resolvePclodKind(pclodLabel: PclodStatusLabel): StatusRowKind {
  switch (pclodLabel) {
    case "処理中":
      return "processing";
    case "待機中":
      return "waiting";
    case "完了":
      return "completed";
    case "不明":
      return "unknown";
    case "-":
      return "idle";
  }
}

function resolveRowStatusKind(
  uploadLabel: UploadStatusLabel,
  pclodLabel: PclodStatusLabel
): StatusRowKind {
  if (uploadLabel === "アップロード中") return "uploading";
  return resolvePclodKind(pclodLabel);
}

function StatusLabelChip({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 80,
        px: 0.75,
        py: 0.25,
        borderRadius: 0.5,
        bgcolor: LABEL_CHIP_BG,
        color: "common.black",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {label}
    </Box>
  );
}

function popoverStatusIcon(kind: StatusRowKind | "upload-done") {
  switch (kind) {
    case "uploading":
    case "processing":
      return <AutorenewIcon sx={{ fontSize: STATUS_ICON_SIZE, ...SPIN_SX, color: "info.light" }} />;
    case "waiting":
      return <ScheduleIcon sx={{ fontSize: STATUS_ICON_SIZE, color: "warning.light" }} />;
    case "completed":
    case "upload-done":
      return <CloudDoneIcon sx={{ fontSize: STATUS_ICON_SIZE, color: "success.light" }} />;
    case "unknown":
      return <HelpOutlineIcon sx={{ fontSize: STATUS_ICON_SIZE, color: "grey.400" }} />;
    case "idle":
      return null;
  }
}

function rowStatusIcon(kind: StatusRowKind) {
  const sx = { fontSize: STATUS_ICON_SIZE, flexShrink: 0 };

  switch (kind) {
    case "uploading":
    case "processing":
      return (
        <AutorenewIcon
          sx={{
            ...sx,
            ...SPIN_SX,
            color: kind === "uploading" ? "text.secondary" : "info.main",
          }}
        />
      );
    case "waiting":
      return <ScheduleIcon sx={{ ...sx, color: "warning.main" }} />;
    case "completed":
      return <CheckCircleIcon sx={{ ...sx, color: "success.main" }} />;
    case "unknown":
      return <HelpOutlineIcon sx={{ ...sx, color: "text.disabled" }} />;
    case "idle":
      return <Box sx={{ width: STATUS_ICON_SIZE, height: STATUS_ICON_SIZE, flexShrink: 0 }} />;
  }
}

type FileStatusHoverPopperProps = {
  anchorEl: HTMLElement;
  uploadLabel: UploadStatusLabel;
  pclodLabel: PclodStatusLabel;
};

function FileStatusHoverPopper({
  anchorEl,
  uploadLabel,
  pclodLabel,
}: FileStatusHoverPopperProps) {
  const uploadIconKind = uploadLabel === "アップロード中" ? "uploading" : "upload-done";
  const pclodIconKind = resolvePclodKind(pclodLabel);

  return (
    <Popper
      open
      anchorEl={anchorEl}
      placement="right"
      modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
      sx={{ zIndex: 1300, pointerEvents: "none" }}
    >
      <Paper
        elevation={4}
        sx={{
          bgcolor: POPOVER_BG,
          color: "common.white",
          p: 1.5,
          pointerEvents: "none",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StatusLabelChip label="アップロード" />
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              {popoverStatusIcon(uploadIconKind)}
              <Typography variant="caption" sx={{ color: "common.white", fontSize: 12 }}>
                {uploadLabel}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StatusLabelChip label="PCLOD処理" />
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              {popoverStatusIcon(pclodIconKind)}
              <Typography variant="caption" sx={{ color: "common.white", fontSize: 12 }}>
                {pclodLabel}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Popper>
  );
}

type FileRowProps = {
  rowKey: string;
  filename: string;
  uploadLabel: UploadStatusLabel;
  pclodLabel: PclodStatusLabel;
  isPclodDone: boolean;
  isVisible: boolean;
  disabled?: boolean;
  onHoverStart: (hovered: HoveredFileStatus) => void;
  onHoverEnd: (rowKey: string) => void;
  onVisibilityToggle?: () => void;
  /** ビューアのカメラを合わせる。DOM の onFocus と区別するため名前を分ける */
  onFocusFile?: () => void;
  onMenuOpen?: (el: HTMLElement) => void;
};

function FileRow({
  rowKey,
  filename,
  uploadLabel,
  pclodLabel,
  isPclodDone,
  isVisible,
  disabled = false,
  onHoverStart,
  onHoverEnd,
  onVisibilityToggle,
  onFocusFile,
  onMenuOpen,
}: FileRowProps) {
  const statusKind = resolveRowStatusKind(uploadLabel, pclodLabel);

  // アップロード完了などで行が消えると mouseleave が発火しないため、
  // アンマウント時に自分の hover 状態を解除して Popper が取り残されないようにする
  useEffect(() => () => onHoverEnd(rowKey), [rowKey, onHoverEnd]);

  const statusText = `アップロード: ${uploadLabel} / PCLOD: ${pclodLabel}`;

  const handleHoverStart = (event: React.SyntheticEvent<HTMLElement>) => {
    onHoverStart({
      rowKey,
      anchorEl: event.currentTarget,
    });
  };

  const handleHoverEnd = () => {
    onHoverEnd(rowKey);
  };

  return (
    <Box
      // マウスに加えてキーボードでも状態を開けるようにする
      tabIndex={0}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
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
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
        }}
      >
        {/* ホバーしない経路（キーボード・支援技術）でも状態を読めるようにする */}
        <Tooltip title={statusText} disableInteractive>
          <Box component="span" sx={{ display: "inline-flex" }} aria-label={statusText}>
            {rowStatusIcon(statusKind)}
          </Box>
        </Tooltip>
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
              onClick={onFocusFile}
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
  const [hoveredStatus, setHoveredStatus] = useState<HoveredFileStatus | null>(null);

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

  const handleHoverStart = useCallback((hovered: HoveredFileStatus) => {
    setHoveredStatus(hovered);
  }, []);

  const handleHoverEnd = useCallback((rowKey: string) => {
    setHoveredStatus((prev) => (prev?.rowKey === rowKey ? null : prev));
  }, []);

  // ホバー開始時点の値を固定せず、再取得のたびに最新のラベルを引き直す
  const hoveredRowStatus =
    hoveredStatus === null ? null : findRowStatus(rows, hoveredStatus.rowKey, getFileStatus);

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
            const rowKey = rowKeyOf(row);

            if (row.type === "pending") {
              return (
                <FileRow
                  key={rowKey}
                  rowKey={rowKey}
                  filename={row.name}
                  uploadLabel="アップロード中"
                  pclodLabel="-"
                  isPclodDone={false}
                  isVisible={false}
                  disabled
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              );
            }

            const { file, visible } = row.container;
            const status = getFileStatus(file);
            const pclodDone = isPclodCompleted(file);

            return (
              <FileRow
                key={file.id}
                rowKey={rowKey}
                filename={file.name}
                uploadLabel={status.upload}
                pclodLabel={status.pclod}
                isPclodDone={pclodDone}
                isVisible={visible}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onVisibilityToggle={() => toggleVisibility(row.container)}
                onFocusFile={() => void focusFile(file)}
                onMenuOpen={(el) => {
                  setMenuAnchor(el);
                  setMenuFile(file);
                }}
              />
            );
          })
        )}
      </Box>

      {hoveredStatus !== null && hoveredRowStatus !== null && (
        <FileStatusHoverPopper
          anchorEl={hoveredStatus.anchorEl}
          uploadLabel={hoveredRowStatus.upload}
          pclodLabel={hoveredRowStatus.pclod}
        />
      )}

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
