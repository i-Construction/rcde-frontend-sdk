import {
  CenterFocusStrong,
  MoreHoriz,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItem,
  MenuList,
  Tooltip,
  Typography,
} from "@mui/material";
import { FC } from "react";
import { useContractFiles } from "../contexts/contractFiles";
import { GlobalStateContext } from "../contexts/state";

export type RightSiderProps = {};

const RightSider: FC<RightSiderProps> = () => {
  const { toggleVisibility, containers } = useContractFiles();
  const state = GlobalStateContext.useSelector((s) => s);
  const actor = GlobalStateContext.useActorRef();

  return (
    <MenuList
      dense
      sx={{
        flex: "0 0 auto",
      }}
    >
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
                  // onClick={handleFileFocus(targetFileContainer.file)}
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
    </MenuList>
  );
};

export { RightSider };
