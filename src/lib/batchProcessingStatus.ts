/**
 * RCD（rcde リポジトリ）の PCLOD バッチ処理ステータスのミラー。
 *
 * 正本: `server/pkg/ent/schema/batchprocessingresult.go` の `BatchProcessingResultStatus`。
 * RCD 側で値を追加・変更したら、本ファイルと `PclodStatus`（contractFileStatus.ts）を同じタイミングで
 * 更新する。SDK 単独で値を発明しない。
 */
export const BATCH_PROCESSING_STATUS = {
  /** 開始 */
  start: 1,
  /** 進行中 */
  inProgress: 2,
  /** 完了 */
  finish: 3,
  /** 失敗（PCLOD ジョブが error.json を出力した） */
  failed: 4,
} as const;

export type BatchProcessingStatus =
  (typeof BATCH_PROCESSING_STATUS)[keyof typeof BATCH_PROCESSING_STATUS];

const KNOWN_STATUSES: readonly number[] = Object.values(BATCH_PROCESSING_STATUS);

/** RCD と SDK の値集合が揃っているか（＝受け取った値が既知のステータスか）を判定する */
export function isBatchProcessingStatus(value: unknown): value is BatchProcessingStatus {
  return typeof value === "number" && KNOWN_STATUSES.includes(value);
}
