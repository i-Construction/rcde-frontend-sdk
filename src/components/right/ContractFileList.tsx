import {
  CenterFocusStrong,
  MoreVert,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  MenuList,
  Tooltip,
  Typography,
} from "@mui/material";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import {
  ContractFile,
  ContractFileContainer,
  useContractFiles,
} from "../../contexts/contractFiles";
import {
  deriveFileStatusLabels,
  isPclodCompleted,
  type PendingUploads,
} from "../../lib/contractFileStatus";
import { useClient } from "../../contexts/client";
import { FileStatusIcon } from "./FileStatusTooltip";

type ContractFileListProps = {
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
  pendingUploads: PendingUploads;
};

type FileListRow =
  | {
      type: "container";
      container: ContractFileContainer;
    }
  | {
      type: "pending";
      contractFileId: number;
      name: string;
    };

type FileListItemProps = {
  uploadStatus: ReturnType<typeof deriveFileStatusLabels>["upload"];
  pclodStatus: ReturnType<typeof deriveFileStatusLabels>["pclod"];
  isPclodDone: boolean;
  filename: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  onFocus: () => void;
  onMenuOpen: (el: HTMLElement) => void;
};

const ICON_BUTTON_SX = {
  width: 24,
  height: 24,
  opacity: 0.7,
  "&:hover": { opacity: 1 },
  "&.Mui-disabled": { opacity: 0.3 },
};

const FileListItem: FC<FileListItemProps> = ({
  uploadStatus,
  pclodStatus,
  isPclodDone,
  filename,
  isVisible,
  onVisibilityToggle,
  onFocus,
  onMenuOpen,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const visibilityTooltip = !isPclodDone
    ? pclodStatus === "処理中"
      ? "PCLOD処理中です"
      : "PCLOD処理が完了していません"
    : isVisible
      ? "非表示にする"
      : "表示する";

  const focusTooltip = !isPclodDone
    ? pclodStatus === "処理中"
      ? "PCLOD処理中です"
      : "PCLOD処理が完了していません"
    : isVisible
      ? "フォーカスする"
      : "非表示のためフォーカスできません";

  return (
    <Box
      ref={rowRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        py: 0.5,
        px: 0.5,
        borderRadius: 1,
        opacity: isVisible ? 1 : 0.5,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <FileStatusIcon
        uploadStatus={uploadStatus}
        pclodStatus={pclodStatus}
        isPclodCompleted={isPclodDone}
        isHovered={isHovered}
        anchorEl={rowRef.current}
      />

      <Typography
        variant="body2"
        title={filename}
        sx={{
          flex: 1,
          minWidth: 0,
          ml: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {filename}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
        <Tooltip title={visibilityTooltip} disableInteractive>
          <span>
            <IconButton
              size="small"
              sx={ICON_BUTTON_SX}
              disabled={!isPclodDone}
              onClick={(e) => {
                e.stopPropagation();
                onVisibilityToggle();
              }}
            >
              {isVisible ? (
                <Visibility sx={{ fontSize: 16 }} />
              ) : (
                <VisibilityOff sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={focusTooltip} disableInteractive>
          <span>
            <IconButton
              size="small"
              sx={ICON_BUTTON_SX}
              disabled={!isPclodDone || !isVisible}
              onClick={(e) => {
                e.stopPropagation();
                onFocus();
              }}
            >
              <CenterFocusStrong sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="その他" disableInteractive>
          <IconButton
            size="small"
            sx={ICON_BUTTON_SX}
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen(e.currentTarget);
            }}
          >
            <MoreVert sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

const ContractFileList: FC<ContractFileListProps> = ({
  onFileFocus,
  onFileDelete,
  pendingUploads,
}) => {
  const { client, project } = useClient();
  const { toggleVisibility, containers } = useContractFiles();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuContainer, setMenuContainer] = useState<ContractFileContainer | undefined>(
    undefined
  );
  const isMenuOpen = menuAnchor !== null;

  const rows = useMemo((): FileListRow[] => {
    const containerRows: FileListRow[] = containers.map((container) => ({
      type: "container",
      container,
    }));
    const containerIds = new Set(containers.map((container) => container.file.id));
    const pendingRows: FileListRow[] = Object.entries(pendingUploads)
      .filter(([contractFileId]) => !containerIds.has(Number(contractFileId)))
      .map(([contractFileId, pendingUpload]) => ({
        type: "pending",
        contractFileId: Number(contractFileId),
        name: pendingUpload.name,
      }));
    return [...containerRows, ...pendingRows];
  }, [containers, pendingUploads]);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuContainer(undefined);
  }, []);

  const handleMenuOpen = useCallback((el: HTMLElement, container: ContractFileContainer) => {
    setMenuAnchor(el);
    setMenuContainer(container);
  }, []);

  const downloadFile = useCallback(
    (file: ContractFile) => {
      const { id } = file;
      if (project === undefined || id === undefined) return;
      client?.getContractFileDownloadUrl(project.contractId, id).then((res) => {
        const { presignedURL } = res;
        if (presignedURL === undefined) return;
        window.open(presignedURL, "_blank");
      });
    },
    [client, project]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      {rows.map((row) => {
        if (row.type === "pending") {
          const statusLabels = deriveFileStatusLabels(
            { id: row.contractFileId, name: row.name },
            true
          );
          return (
            <FileListItem
              key={`pending-${row.contractFileId}`}
              uploadStatus={statusLabels.upload}
              pclodStatus={statusLabels.pclod}
              isPclodDone={false}
              filename={row.name}
              isVisible={false}
              onVisibilityToggle={() => {}}
              onFocus={() => {}}
              onMenuOpen={() => {}}
            />
          );
        }

        const { file, visible } = row.container;
        const isPendingUpload = pendingUploads[file.id] !== undefined;
        const statusLabels = deriveFileStatusLabels(file, isPendingUpload);
        const pclodDone = isPclodCompleted(file);

        return (
          <FileListItem
            key={file.id}
            uploadStatus={statusLabels.upload}
            pclodStatus={statusLabels.pclod}
            isPclodDone={pclodDone}
            filename={file.name}
            isVisible={visible}
            onVisibilityToggle={() => toggleVisibility(row.container)}
            onFocus={() => onFileFocus(file)}
            onMenuOpen={(el) => handleMenuOpen(el, row.container)}
          />
        );
      })}

      <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={handleMenuClose}>
        <MenuList dense>
          <MenuItem
            onClick={() => {
              if (menuContainer !== undefined) {
                downloadFile(menuContainer.file);
              }
              handleMenuClose();
            }}
          >
            ダウンロード
          </MenuItem>
          {
            // eslint-disable-next-line no-constant-binary-expression
            false && (
              <MenuItem
                sx={{ color: "error.main" }}
                onClick={() => {
                  if (menuContainer !== undefined) {
                    onFileDelete(menuContainer.file);
                  }
                  handleMenuClose();
                }}
              >
                削除
              </MenuItem>
            )
          }
        </MenuList>
      </Menu>
    </Box>
  );
};

export { ContractFileList };
