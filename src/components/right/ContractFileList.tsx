import { MoreHoriz, Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, ListItem, Tooltip, Typography } from "@mui/material";
import { FC } from "react";
import { ContractFile, useContractFiles } from "../../contexts/contractFiles";

import { CenterFocusStrong } from "@mui/icons-material";
type ContractFileListProps = {
  onFileFocus: (file: ContractFile) => void;
};

const ContractFileList: FC<ContractFileListProps> = ({ onFileFocus }) => {
  const { toggleVisibility, containers } = useContractFiles();

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
                  // onClick={handleContractFileMenuClick(targetFileContainer)}
                >
                  <MoreHoriz />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItem>
        );
      })}
    </>
  );

};

export { ContractFileList };
