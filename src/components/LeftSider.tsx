import { Adjust } from "@mui/icons-material";
import { ListItemIcon, ListItemText, MenuItem, MenuList } from "@mui/material";
import { FC, useMemo } from "react";
import { GlobalStateContext } from "../contexts/state";

type Menu = {
  icon: JSX.Element;
  text: string;
  selected?: boolean;
  onClick?: () => void;
};

const LeftSider: FC = () => {
  const state = GlobalStateContext.useSelector((s) => s);
  const actor = GlobalStateContext.useActorRef();

  const menus: Menu[] = useMemo(() => {
    return [
      /*
      {
        icon: <Palette />,
        text: "外観",
        selected: state.matches("appearance"),
      },
      */
      {
        icon: <Adjust />,
        text: "基準点",
        selected: state.matches("reference_point"),
        onClick: () => {
          if (state.matches("reference_point")) {
            actor.send({ type: "IDLE" });
          } else {
            actor.send({ type: "REFERENCE_POINT" });
          }
        },
      },
      /*
      {
        icon: <OpenWith />,
        text: "移動",
        selected: state.matches("transform.position"),
      },
      {
        icon: <RotateLeft />,
        text: "回転",
        selected: state.matches("transform.rotation"),
      },
      {
        icon: <SquareFoot />,
        text: "寸法",
        selected: state.matches("metric"),
      },
      {
        icon: <ThreeDRotation />,
        text: "モデリング",
        selected: state.matches("modeling"),
      },
      */
    ];
  }, [state, actor]);

  return (
    <MenuList
      dense
      sx={{
        flex: "0 0 auto",
      }}
    >
      {menus.map((menu, index) => {
        return (
          <MenuItem key={index} onClick={menu.onClick} selected={menu.selected}>
            <ListItemIcon>{menu.icon}</ListItemIcon>
            <ListItemText primary={menu.text} />
          </MenuItem>
        );
      })}
    </MenuList>
  );
};

export { LeftSider };
