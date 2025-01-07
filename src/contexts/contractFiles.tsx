import { RCDEClient } from "@rcde/api-sdk";
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export type ContractFiles = NonNullable<
  Awaited<ReturnType<RCDEClient["getContractFileList"]>>["contractFiles"]
>;
export type ContractFile = ContractFiles[number];

export type ContractFileContainer = {
  file: ContractFile;
  visible: boolean;
};

type ContractFilesContextType = {
  containers: ContractFileContainer[];
  load: (files: ContractFiles) => void;
  toggleVisibility: (container: ContractFileContainer) => void;
};

const ContractFilesContext = createContext<
  ContractFilesContextType | undefined
>(undefined);

export const ContractFilesProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [containers, setContainers] = useState<ContractFileContainer[]>([]);

  const load = useCallback((files: ContractFiles) => {
    setContainers(
      files.map((file) => ({
        file,
        visible: true,
      }))
    );
  }, []);

  const toggleVisibility = useCallback((container: ContractFileContainer) => {
    setContainers((containers) =>
      containers.map((c) =>
        c.file.id === container.file.id
          ? {
              ...c,
              visible: !c.visible,
            }
          : c
      )
    );
  }, []);

  return (
    <ContractFilesContext.Provider
      value={{ load, toggleVisibility, containers }}
    >
      {children}
    </ContractFilesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useContractFiles = (): ContractFilesContextType => {
  const context = useContext(ContractFilesContext);
  if (!context) {
    throw new Error(
      "useContractFiles must be used within a ContractFilesProvider"
    );
  }
  return context;
};
