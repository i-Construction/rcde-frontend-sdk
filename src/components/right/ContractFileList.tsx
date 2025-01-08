import { MoreHoriz, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItem,
  Menu,
  MenuItem,
  MenuList,
  Tooltip,
  Typography,
} from "@mui/material";
import { FC, useCallback, useState } from "react";
import {
  ContractFile,
  ContractFileContainer,
  useContractFiles,
} from "../../contexts/contractFiles";

import { CenterFocusStrong } from "@mui/icons-material";
import { useClient } from "../../contexts/client";
type ContractFileListProps = {
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
};

const ContractFileList: FC<ContractFileListProps> = ({
  onFileFocus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFileDelete,
}) => {
  const { client, project } = useClient();
  const { toggleVisibility, containers } = useContractFiles();
  const [focused, setFocused] = useState<{
    el: HTMLElement;
    container: ContractFileContainer;
  } | null>(null);
  const open = focused !== null;

  const handleDetailClick = useCallback(
    (el: HTMLElement, container: ContractFileContainer) => {
      setFocused({ el, container });
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setFocused(null);
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
    <>
      {containers.map((container) => {
        const { file, visible } = container;
        return (
          <ListItem key={file.id}>
            <Typography variant="body2" marginRight={2}>
              {file.name}
            </Typography>
            <Box>
              <Tooltip title="ファイルを表示">
                <IconButton
                  size="small"
                  // disabled={ file.category === ContractFileCategoryMap.PROGRESS}
                  onClick={() => {
                    toggleVisibility(container);
                  }}
                >
                  {visible ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Tooltip>
              <Tooltip title="ファイルの中心に移動">
                <IconButton
                  size="small"
                  disabled={!visible}
                  onClick={() => {
                    onFileFocus(file);
                  }}
                >
                  <CenterFocusStrong />
                </IconButton>
              </Tooltip>
              <Tooltip title="ファイルの詳細">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    handleDetailClick(e.currentTarget, container);
                  }}
                >
                  <MoreHoriz />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItem>
        );
      })}
      <Menu anchorEl={focused?.el} open={open} onClose={handleMenuClose}>
        <MenuList dense>
          <MenuItem
            onClick={() => {
              if (focused !== null) {
                downloadFile(focused.container.file);
              }
            }}
          >
            ダウンロード
          </MenuItem>
          {/*
            <MenuItem
              sx={{ color: "red" }}
              onClick={() => {
                if (focused !== null) {
                  onFileDelete(focused.container.file);
                }
              }}
            >
              削除
            </MenuItem>
          </MenuList>
          */}
        </MenuList>
      </Menu>
    </>
  );
};

export { ContractFileList };
