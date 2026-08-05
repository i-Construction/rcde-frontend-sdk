import { useCallback, useMemo } from "react";
import { useClient } from "../contexts/client";
import { ContractFile, ContractFileContainer, useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import {
  deriveFileStatusLabels,
  isPclodCompleted,
  type FileStatusLabels,
  type PendingUploads,
} from "../lib/contractFileStatus";

/** ファイル一覧の1行分のデータ（登録済みファイル or アップロード中） */
export type ContractFileRow =
  | { type: "container"; container: ContractFileContainer }
  | { type: "pending"; contractFileId: number; name: string };

export type ContractFileActions = {
  /** 登録済みファイルとアップロード中ファイルをマージした一覧行 */
  rows: ContractFileRow[];
  /** 表示/非表示を切り替える */
  toggleVisibility: (container: ContractFileContainer) => void;
  /** 指定ファイルのバウンディングボックス中心へ基準点を移動してフォーカスする */
  focusFile: (file: ContractFile) => Promise<void>;
  /** ダウンロード用の署名付きURLを取得して別タブで開く */
  downloadFile: (file: ContractFile) => Promise<void>;
  /** アップロード/PCLOD のステータスラベルを導出する */
  getFileStatus: (file: ContractFile, isPendingUpload: boolean) => FileStatusLabels;
  /** PCLOD 処理が完了しているか */
  isPclodCompleted: (file: ContractFile) => boolean;
};

/**
 * レフト/ライトサイドバーのファイル一覧が持っていた機能を UI から切り離したフック。
 *
 * ファイル一覧行の生成、表示切替、フォーカス、ダウンロード、ステータス判定を提供する。
 * 呼び出し元が任意の UI を組んで利用する。
 *
 * @example
 * ```tsx
 * const { rows, toggleVisibility, focusFile, downloadFile, getFileStatus, isPclodCompleted } =
 *   useContractFileActions(pendingUploads);
 * ```
 */
export const useContractFileActions = (pendingUploads: PendingUploads = {}): ContractFileActions => {
  const { client, project } = useClient();
  const { containers, toggleVisibility } = useContractFiles();
  const { focusFileById } = useReferencePoint();

  const rows = useMemo<ContractFileRow[]>(() => {
    const containerRows: ContractFileRow[] = containers.map((container) => ({
      type: "container",
      container,
    }));
    const containerIds = new Set(containers.map((container) => container.file.id));
    const pendingRows: ContractFileRow[] = Object.entries(pendingUploads)
      .filter(([contractFileId]) => !containerIds.has(Number(contractFileId)))
      .map(([contractFileId, pendingUpload]) => ({
        type: "pending",
        contractFileId: Number(contractFileId),
        name: pendingUpload.name,
      }));
    return [...containerRows, ...pendingRows];
  }, [containers, pendingUploads]);

  const focusFile = useCallback(
    async (file: ContractFile) => {
      if (file.id === undefined) return;
      await focusFileById(file.id);
    },
    [focusFileById]
  );

  const downloadFile = useCallback(
    async (file: ContractFile) => {
      if (project === undefined || client === undefined) return;
      const id = file?.id;
      if (id === undefined) return;
      try {
        const res = await client.getContractFileDownloadUrl(project.contractId, id);
        const presignedURL = res?.presignedURL;
        // 空文字・undefined など無効な URL は開かない
        if (!presignedURL) return;
        window.open(presignedURL, "_blank");
      } catch (err) {
        console.error("[useContractFileActions] ダウンロードURLの取得に失敗しました:", err);
      }
    },
    [client, project]
  );

  const getFileStatus = useCallback(
    (file: ContractFile, isPendingUpload: boolean) => deriveFileStatusLabels(file, isPendingUpload),
    []
  );

  return {
    rows,
    toggleVisibility,
    focusFile,
    downloadFile,
    getFileStatus,
    isPclodCompleted,
  };
};
