import { Box, IconButton, ListItem, MenuItem, MenuList, Typography } from "@mui/material";
import { FC } from "react";
import { GlobalStateContext } from "../contexts/state";
import { ContractFiles } from "../contexts/client";
import {
  CenterFocusStrong,
  MoreHoriz,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

export type RightSiderProps = {
  files: ContractFiles;
};

const RightSider: FC<RightSiderProps> = ({ files }) => {
  const state = GlobalStateContext.useSelector((s) => s);
  const actor = GlobalStateContext.useActorRef();

  return (
    <MenuList dense sx={{
      flex: '0 0 auto'
    }}>
      {files.map((file) => {
        return (
          <ListItem key={file.id}>
            <Typography variant="body2" marginRight={2}>
              {file.name}
            </Typography>
            <Box>
              <IconButton
                size="small"
                // disabled={!targetFileContainer.visible}
                // onClick={handleFileFocus(targetFileContainer.file)}
                title=""
              >
                <CenterFocusStrong />
              </IconButton>
              <IconButton
                size="small"
                // disabled={ targetFileContainer.file.category === ContractFileCategoryMap.PROGRESS}
                // onClick={handleFileVisibility(targetFileContainer.file)}
                title="表示/非表示"
              >
                <Visibility />
                {/*targetFileContainer.visible ? (
                  <Visibility />
                ) : (
                  <VisibilityOff />
                )*/}
              </IconButton>
              <IconButton
                size="small"
                title="その他"
                // onClick={handleContractFileMenuClick(targetFileContainer)}
              >
                <MoreHoriz />
              </IconButton>
            </Box>
          </ListItem>
        );
      })}
    </MenuList>
  );
};

export { RightSider };
