import { RCDEClient } from "../lib/rcde-client";
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from "react";

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
  updateFiles: (files: ContractFiles) => void;
  toggleVisibility: (container: ContractFileContainer) => void;
};

const ContractFilesContext = createContext<ContractFilesContextType | undefined>(undefined);

/**
 * 表示・非表示を切り替えたあとのコンテナ列を返す。
 *
 * 対象の特定を ID だけに頼らない。ID は R-CDE から整数として読めなかったときに undefined に
 * なり得るので、ID だけで突き合わせると undefined === undefined が成立し、ID を持たないファイルが
 * 2 件以上あるときに全件が同時に切り替わる。
 *
 * まず参照で照合する。toggleVisibility へ渡される container は containers 配列の要素そのもの
 * （useContractFileActions の rows が参照をそのまま持ち、利用側はそれを返してくる）なので、通常は
 * これで一致する。一覧の再取得でコンテナが作り直されたあとに古い参照で呼ばれても取りこぼさないよう、
 * ID を読めるときだけ ID でも照合する。undefined 同士は一致とみなさない。
 */
// eslint-disable-next-line react-refresh/only-export-components
export function toggleContainerVisibility(
  containers: ContractFileContainer[],
  target: ContractFileContainer
): ContractFileContainer[] {
  const isTarget = (container: ContractFileContainer) =>
    container === target ||
    (container.file.id !== undefined && container.file.id === target.file.id);

  return containers.map((container) =>
    isTarget(container) ? { ...container, visible: !container.visible } : container
  );
}

export const ContractFilesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [containers, setContainers] = useState<ContractFileContainer[]>([]);

  const load = useCallback((files: ContractFiles, visibleIds?: number[]) => {
    setContainers(
      files.map((file) => ({
        file,
        visible:
          visibleIds === undefined ? true : file.id !== undefined && visibleIds.includes(file.id),
      }))
    );
  }, []);

  const updateFiles = useCallback((files: ContractFiles) => {
    setContainers((prev) => {
      const prevVisibleById = new Map(
        prev.map((container) => [container.file.id, container.visible])
      );
      return files.map((file) => ({
        file,
        visible: prevVisibleById.get(file.id) ?? true,
      }));
    });
  }, []);

  const toggleVisibility = useCallback((container: ContractFileContainer) => {
    setContainers((containers) => toggleContainerVisibility(containers, container));
  }, []);

  const value = useMemo<ContractFilesContextType>(
    () => ({ load, updateFiles, toggleVisibility, containers }),
    [load, updateFiles, toggleVisibility, containers]
  );

  return <ContractFilesContext.Provider value={value}>{children}</ContractFilesContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useContractFiles = (): ContractFilesContextType => {
  const context = useContext(ContractFilesContext);
  if (!context) {
    throw new Error("useContractFiles must be used within a ContractFilesProvider");
  }
  return context;
};
