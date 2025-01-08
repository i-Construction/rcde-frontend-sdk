import {
  Adjust,
  InsertDriveFile
} from "@mui/icons-material";
import { ListItemIcon, ListItemText, MenuItem, MenuList } from "@mui/material";
import { FC, useCallback, useMemo, useState } from "react";
import { GlobalStateContext } from "../contexts/state";
import { FileUploadModal } from "./FileUploadModal";

type Menu = {
  icon: JSX.Element;
  text: string;
  selected?: boolean;
  onClick?: () => void;
};

export type LeftSiderProps = {
  contractId: number;
};

const LeftSider: FC<LeftSiderProps> = ({
  contractId,
}) => {
  const state = GlobalStateContext.useSelector((s) => s);
  const actor = GlobalStateContext.useActorRef();

  const [open, setOpen] = useState<{
    file?: boolean;
  }>({
    file: false,
  });

  const handleOnClose = useCallback((key: keyof typeof open) => () => {
    setOpen((prev) => ({ ...prev, [key]: false }));
  }, []);

  const menus: Menu[] = useMemo(() => {
    return [
      {
        icon: <InsertDriveFile />,
        text: "ファイル",
        onClick: () => {
          setOpen({ file: true });
          actor.send({ type: "IDLE" });
        },
      },
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
    <MenuList dense sx={{
      flex: '0 0 auto',
    }}>
      {menus.map((menu, index) => {
        return (
          <MenuItem key={index} onClick={menu.onClick} selected={menu.selected}>
            <ListItemIcon>{menu.icon}</ListItemIcon>
            <ListItemText primary={menu.text} />
          </MenuItem>
        );
      })}
      <FileUploadModal
        contractId={contractId}
        open={open.file ?? false}
        onUploaded={handleOnClose("file")}
        onClose={handleOnClose("file")}
      />
    </MenuList>
  );
};

export { LeftSider };
