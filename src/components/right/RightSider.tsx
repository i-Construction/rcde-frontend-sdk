import { FC } from "react";
import { ContractFile } from "../../contexts/contractFiles";
import { GlobalStateContext } from "../../contexts/state";
import { ContractFileList } from "./ContractFileList";
import { ReferencePoint } from "./ReferencePoint";
import { MenuList } from "@mui/material";

export type RightSiderProps = {
  onFileFocus: (file: ContractFile) => void;
  onFileDelete: (file: ContractFile) => void;
};

const RightSider: FC<RightSiderProps> = ({ onFileFocus, onFileDelete }) => {
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
        />
      )}
    </MenuList>
  );
};

export { RightSider };
