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
  /**
   * 指定ファイルのバウンディングボックス中心へ基準点を移動してフォーカスする。
   * 成功した場合は `true`、対象なし・未完了・失敗時は `false` を返す。
   */
  focusFile: (file: ContractFile) => Promise<boolean>;
  /**
   * ダウンロード用の署名付きURLを取得して別タブで開く。
   * 別タブを開いた場合は `true`、URL 取得失敗・無効 URL・前提不足時は `false` を返す。
   */
  downloadFile: (file: ContractFile) => Promise<boolean>;
  /**
   * アップロード/PCLOD のステータスラベルを導出する。
   * アップロード中判定はフックが保持する `pendingUploads` から内部で行う。
   */
  getFileStatus: (file: ContractFile) => FileStatusLabels;
  /** PCLOD 処理が完了しているか */
  isPclodCompleted: (file: ContractFile) => boolean;
};

// デフォルト引数で毎回新しい {} を生成すると rows のメモ化が無効になるため、共有の空定数を使う
const EMPTY_PENDING_UPLOADS: PendingUploads = {};

/**
 * レフト/ライトサイドバーのファイル一覧が持っていた機能を UI から切り離したフック。
 *
 * ファイル一覧行の生成、表示切替、フォーカス、ダウンロード、ステータス判定を提供する。
 * 呼び出し元が任意の UI を組んで利用する。
 *
 * @remarks
 * `ClientProvider` / `ContractFilesProvider` / `ReferencePointProvider` の配下でのみ利用できる
 * （例: `RCDE` コンポーネントの `children` / `auxiliaryContent`、または各 Provider を自前で構成した
 * ツリー）。プロバイダ外で呼ぶと各コンテキストが throw する。RCDE 利用時のマウント先は
 * `auxiliaryContent` になるためキャンバスへの重ね描きになる。ビューアと横並びにしたい場合は
 * `Viewer` と各 Provider を自前で組む必要がある。
 *
 * @example
 * ```tsx
 * const { rows, toggleVisibility, focusFile, downloadFile, getFileStatus, isPclodCompleted } =
 *   useContractFileActions(pendingUploads);
 * ```
 */
export const useContractFileActions = (
  pendingUploads: PendingUploads = EMPTY_PENDING_UPLOADS
): ContractFileActions => {
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
    async (file: ContractFile): Promise<boolean> => {
      // 呼び出し側の誤用（file / id 未指定）に備えた防御的ガード。downloadFile と同じ形に揃える
      const id = file?.id;
      if (id === undefined) return false;
      return focusFileById(id);
    },
    [focusFileById]
  );

  const downloadFile = useCallback(
    async (file: ContractFile): Promise<boolean> => {
      if (project === undefined || client === undefined) return false;
      const id = file?.id;
      if (id === undefined) return false;
      try {
        const res = await client.getContractFileDownloadUrl(project.contractId, id);
        const presignedURL = res?.presignedURL;
        // 空文字・undefined など無効な URL は開かない
        if (!presignedURL) return false;
        // window.open は <a target="_blank"> と違い暗黙の noopener が付かないため明示する（reverse tabnabbing 対策）
        window.open(presignedURL, "_blank", "noopener,noreferrer");
        return true;
      } catch (err) {
        console.error("[useContractFileActions] ダウンロードURLの取得に失敗しました:", err);
        return false;
      }
    },
    [client, project]
  );

  const getFileStatus = useCallback(
    (file: ContractFile): FileStatusLabels => {
      // 呼び出し側の誤用（file 未指定）でも throw しないよう防御する。focusFile / downloadFile と姿勢を揃える
      if (!file) return { upload: "アップロード中", pclod: "待機中" };
      // アップロード中判定はフックが保持する pendingUploads から行い、呼び出し側に委ねない
      const isPendingUpload = file.id !== undefined && pendingUploads[file.id] !== undefined;
      return deriveFileStatusLabels(file, isPendingUpload);
    },
    [pendingUploads]
  );

  // 戻り値も毎レンダーで新規参照にならないようメモ化する（利用側の memo / 依存配列を壊さない）
  return useMemo(
    () => ({
      rows,
      toggleVisibility,
      focusFile,
      downloadFile,
      getFileStatus,
      isPclodCompleted,
    }),
    [rows, toggleVisibility, focusFile, downloadFile, getFileStatus]
  );
};
