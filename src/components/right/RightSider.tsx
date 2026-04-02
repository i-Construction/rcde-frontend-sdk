import { FC } from "react";
import { GlobalStateContext } from "../../contexts/state";
import { ReferencePoint } from "./ReferencePoint";
import { MenuList } from "@mui/material";

// RightSider は基準点モード時のみ表示するパネル。
// ファイル一覧は LeftSider に移動済み。
export type RightSiderProps = Record<string, never>;

const RightSider: FC<RightSiderProps> = () => {
  const state = GlobalStateContext.useSelector((s) => s);

  const isReferencePoint = state.matches("reference_point");
  if (!isReferencePoint) return null;

  return (
    <MenuList
      dense
      sx={{
        flex: "0 0 auto",
      }}
    >
      <ReferencePoint />
    </MenuList>
  );
};

export { RightSider };
