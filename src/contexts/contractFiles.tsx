import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createContainers, mergeContainersPreservingVisibility } from "./contractFileContainers";
import type { ContractFile } from "../lib/rcde-client";

/**
 * 契約ファイルの型は rcde-client.ts が正本。ここは公開 API の入口として再輸出するだけで、
 * getContractFileList の戻り値から逆算しない。逆算にすると定義の所在が読み取りにくく、
 * クライアントのメソッド定義を変えたときに公開型が黙って動く。
 */
export type { ContractFile };
export type ContractFiles = ContractFile[];

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
