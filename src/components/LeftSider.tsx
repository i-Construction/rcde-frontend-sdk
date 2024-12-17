import {
  Adjust,
  InsertDriveFile,
  OpenWith,
  Palette,
  RotateLeft,
  SquareFoot,
  ThreeDRotation,
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
  constructionId: number;
  contractId: number;
};

const LeftSider: FC<LeftSiderProps> = ({
  constructionId,
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
      {
        icon: <Palette />,
        text: "外観",
        selected: state.matches("appearance"),
      },
      {
        icon: <Adjust />,
        text: "基準点",
        selected: state.matches("reference_point"),
      },
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
    ];
  }, [open, state]);

  return (
    <MenuList dense>
      {menus.map((menu, index) => {
        return (
          <MenuItem key={index} onClick={menu.onClick}>
            <ListItemIcon>{menu.icon}</ListItemIcon>
            <ListItemText primary={menu.text} />
          </MenuItem>
        );
      })}
      <FileUploadModal
        constructionId={constructionId}
        contractId={contractId}
        open={open.file ?? false}
        onUploaded={handleOnClose("file")}
        onClose={handleOnClose("file")}
      />
    </MenuList>
  );
};

export { LeftSider };
