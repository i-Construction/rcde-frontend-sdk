import { MenuList } from "@mui/material";
import { FC } from "react";
import { ContractFile } from "../../contexts/contractFiles";
import { GlobalStateContext } from "../../contexts/state";
import type { PendingUploads } from "../../lib/contractFileStatus";
import { ContractFileList } from "./ContractFileList";
import { ReferencePoint } from "./ReferencePoint";

export type RightSiderProps = {
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
  pendingUploads: PendingUploads;
};

const RightSider: FC<RightSiderProps> = ({ onFileFocus, onFileDelete, pendingUploads }) => {
  const state = GlobalStateContext.useSelector((s) => s);

  return (
    <MenuList
      dense
      sx={{
        flex: "0 0 auto",
      }}
    >
      {state.matches("reference_point") ? (
        <ReferencePoint />
      ) : (
        <ContractFileList
          onFileFocus={onFileFocus}
          onFileDelete={onFileDelete}
          pendingUploads={pendingUploads}
        />
      )}
    </MenuList>
  );
};

export { RightSider };
