import { RCDEClient } from "../lib/rcde-client";
import { createContext, FC, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { createContainers, mergeContainersPreservingVisibility } from "./contractFileContainers";

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
  load: (files: ContractFiles, visibleIds?: number[]) => void;
  /**
   * 再取得した一覧でファイルの中身を差し替える。表示・非表示は ID で前回の状態を引き継ぐ。
   * 前回に無かったファイルは、直近の load で適用した visibleIds に従う。
   * load を一度も呼んでいなければ visibleIds は未指定の扱いになり、全件が表示になる。
   */
  updateFiles: (files: ContractFiles) => void;
  toggleVisibility: (container: ContractFileContainer) => void;
};

const ContractFilesContext = createContext<ContractFilesContextType | undefined>(undefined);

export const ContractFilesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [containers, setContainers] = useState<ContractFileContainer[]>([]);

  // load で適用した可視ポリシー。再取得で新しく現れたファイルにも同じ方針を当てはめるため覚えておく。
  const loadedVisibleIdsRef = useRef<number[] | undefined>(undefined);

  const load = useCallback((files: ContractFiles, visibleIds?: number[]) => {
    loadedVisibleIdsRef.current = visibleIds;
    setContainers(createContainers(files, visibleIds));
  }, []);

  const updateFiles = useCallback((files: ContractFiles) => {
    setContainers((prev) =>
      mergeContainersPreservingVisibility(prev, files, loadedVisibleIdsRef.current)
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
    <ContractFilesContext.Provider value={{ load, updateFiles, toggleVisibility, containers }}>
      {children}
    </ContractFilesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useContractFiles = (): ContractFilesContextType => {
  const context = useContext(ContractFilesContext);
  if (!context) {
    throw new Error("useContractFiles must be used within a ContractFilesProvider");
  }
  return context;
};
