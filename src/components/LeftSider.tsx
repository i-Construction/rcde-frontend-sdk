import {
  Cached,
  CenterFocusStrong,
  Download,
  MoreVert,
  UploadFile,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { FC, useCallback, useState } from "react";
import {
  ContractFile,
  ContractFileContainer,
  useContractFiles,
} from "../contexts/contractFiles";
import { useClient } from "../contexts/client";
import { GlobalStateContext } from "../contexts/state";
import { FileUploadModal } from "./FileUploadModal";

export type LeftSiderProps = {
  contractId: number;
  onUploaded?: () => void;
  onFileFocus?: (file: ContractFile) => void;
  open?: boolean;
};

type FileMenuState = {
  el: HTMLElement;
  container: ContractFileContainer;
};

const LeftSider: FC<LeftSiderProps> = ({
  contractId,
  onUploaded,
  onFileFocus,
  open = true,
}) => {
  const actor = GlobalStateContext.useActorRef();
  const { client, project } = useClient();
  const { toggleVisibility, containers } = useContractFiles();

  const [openUpload, setOpenUpload] = useState(false);
  const [fileMenu, setFileMenu] = useState<FileMenuState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleUploaded = useCallback(() => {
    onUploaded?.();
    setOpenUpload(false);
  }, [onUploaded]);

  const handleFileFocusClick = useCallback(
    (file: ContractFile) => {
      onFileFocus?.(file);
    },
    [onFileFocus]
  );

  const handleFileMenuOpen = useCallback(
    (el: HTMLElement, container: ContractFileContainer) => {
      setFileMenu({ el, container });
    },
    []
  );

  const handleFileMenuClose = useCallback(() => {
    setFileMenu(null);
  }, []);

  const handleDownload = useCallback(
    (file: ContractFile) => {
      const { id } = file;
      if (!project || id === undefined) return;
      client?.getContractFileDownloadUrl(project.contractId, id).then((res) => {
        if (!res.presignedURL) return;
        window.open(res.presignedURL, "_blank");
      });
      handleFileMenuClose();
    },
    [client, project, handleFileMenuClose]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onUploaded?.();
    setTimeout(() => setRefreshing(false), 800);
  }, [onUploaded]);

  const handleOpenUpload = useCallback(() => {
    setOpenUpload(true);
    actor.send({ type: "IDLE" });
  }, [actor]);

  const isNotOpen = !open;
  if (isNotOpen) return null;

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        flex: "0 0 auto",
        width: 256,
        height: "100%",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {/* ── サイドバーヘッダー ── */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          minHeight: 48,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: "0.875rem", color: "text.primary" }}
        >
          ファイル
        </Typography>
        <Box display="flex" alignItems="center">
          <Tooltip title="一覧を更新">
            <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <CircularProgress size={16} />
              ) : (
                <Cached fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="点群をアップロード">
            <IconButton size="small" onClick={handleOpenUpload}>
              <UploadFile fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {refreshing && <LinearProgress sx={{ height: 2 }} />}

      {/* ── ファイル一覧 ── */}
      <Box flex={1} overflow="auto" sx={{ py: 0.5 }}>
        {containers.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ px: 3, pt: 5, gap: 1.5 }}
          >
            <UploadFile sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              点群ファイルがありません
            </Typography>
            <Typography variant="caption" color="text.disabled" textAlign="center">
              アップロードボタンからファイルを
              <br />
              追加してください
            </Typography>
          </Box>
        ) : (
          containers.map((container) => {
            const { file, visible } = container;
            return (
              <Box
                key={file.id}
                display="flex"
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.25,
                  mx: 0.5,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                  "&:hover .actions": { opacity: 1 },
                  ".actions": { opacity: 0, transition: "opacity 0.15s" },
                }}
              >
                {/* ファイル名 */}
                <Tooltip title={file.name} placement="right" disableInteractive>
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: "0.8125rem",
                      color: visible ? "text.primary" : "text.disabled",
                      pr: 0.5,
                    }}
                  >
                    {file.name}
                  </Typography>
                </Tooltip>

                {/* ホバー時に表示するアクションボタン群 */}
                <Box className="actions" display="flex" alignItems="center">
                  <Tooltip title="ファイルの中心に移動" disableInteractive>
                    <span>
                      <IconButton
                        size="small"
                        sx={{ p: 0.375 }}
                        disabled={!visible || !onFileFocus}
                        onClick={() => handleFileFocusClick(file)}
                      >
                        <CenterFocusStrong sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="その他の操作" disableInteractive>
                    <IconButton
                      size="small"
                      sx={{ p: 0.375 }}
                      onClick={(e) => handleFileMenuOpen(e.currentTarget, container)}
                    >
                      <MoreVert sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* 常時表示：表示切替ボタン */}
                <Tooltip
                  title={visible ? "非表示にする" : "表示する"}
                  disableInteractive
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.375, flexShrink: 0 }}
                    onClick={() => toggleVisibility(container)}
                  >
                    {visible ? (
                      <Visibility sx={{ fontSize: 16 }} />
                    ) : (
                      <VisibilityOff sx={{ fontSize: 16, color: "text.disabled" }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>

      <Divider />

      {/* ── コンテキストメニュー ── */}
      <Menu
        anchorEl={fileMenu?.el}
        open={fileMenu !== null}
        onClose={handleFileMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 160, boxShadow: 3 } } }}
      >
        <MenuItem
          dense
          onClick={() => {
            if (fileMenu) handleDownload(fileMenu.container.file);
          }}
        >
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ variant: "body2" }}>
            ダウンロード
          </ListItemText>
        </MenuItem>
      </Menu>

      <FileUploadModal
        contractId={contractId}
        open={openUpload}
        onUploaded={handleUploaded}
        onClose={() => setOpenUpload(false)}
      />
    </Box>
  );
};

export { LeftSider };
