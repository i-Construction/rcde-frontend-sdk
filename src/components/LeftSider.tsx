import {
  Adjust,
  InsertDriveFile,
  OpenWith,
  Palette,
  RotateLeft,
  SquareFoot,
  ThreeDRotation
} from "@mui/icons-material";
import { ListItemIcon, ListItemText, MenuItem, MenuList } from "@mui/material";
import { FC, useMemo } from "react";
import { GlobalStateContext } from "../contexts/state";

type Menu = {
  icon: JSX.Element;
  text: string;
  onClick?: () => void;
};

export type LeftSiderProps = {
};

const LeftSider: FC<LeftSiderProps> = ({
}) => {
  const actor = GlobalStateContext.useActorRef();

  const menus: Menu[] = useMemo(() => {
    return [
      {
        icon: <InsertDriveFile />,
        text: "ファイル",
      },
      {
        icon: <Palette />,
        text: "外観",
      },
      {
        icon: <Adjust />,
        text: "基準点",
      },
      {
        icon: <OpenWith />,
        text: "移動",
      },
      {
        icon: <RotateLeft />,
        text: "回転",
      },
      {
        icon: <SquareFoot />,
        text: "寸法",
      },
      {
        icon: <ThreeDRotation />,
        text: "モデリング",
      },
    ];
  }, []);

  return (
    <MenuList dense>
      {
        menus.map((menu, index) => {
          return (
            <MenuItem key={index} onClick={menu.onClick}>
              <ListItemIcon>
                {menu.icon}
              </ListItemIcon>
              <ListItemText primary={menu.text} />
            </MenuItem>
          );
        })
      }
    </MenuList>
  );
};

export { LeftSider };
