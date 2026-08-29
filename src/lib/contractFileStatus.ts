import { BATCH_PROCESSING_STATUS } from "./batchProcessingStatus";
import type { BatchProcessingResult, ContractFile } from "./rcde-client";

export type UploadStatus = "uploading" | "uploaded";

/**
 * PCLOD 処理の状態。RCD の BatchProcessingResultStatus と対になる（batchProcessingStatus.ts）。
 * `unknown` は RCD と SDK の値集合がずれたときだけ現れる異常系で、SDK の追随漏れを示す。
 */
export type PclodStatus = "none" | "waiting" | "processing" | "completed" | "failed" | "unknown";

export type FileStatus = {
  upload: UploadStatus;
  pclod: PclodStatus;
};

export type PendingUpload = {
  name: string;
};

export type PendingUploads = Record<number, PendingUpload>;

function isUploaded(file: ContractFile): boolean {
  return file.uploadedAt !== undefined && file.uploadedAt.length > 0;
}

function derivePclodStatus(result: BatchProcessingResult | undefined): PclodStatus {
  // バッチ結果がまだ無いファイルは PCLOD 未着手
  if (result === undefined) return "waiting";

  const status = result.status;
  switch (status) {
    case BATCH_PROCESSING_STATUS.start:
    case BATCH_PROCESSING_STATUS.inProgress:
      return "processing";
    case BATCH_PROCESSING_STATUS.finish:
      return "completed";
    case BATCH_PROCESSING_STATUS.failed:
      return "failed";
    case "unknown":
      return "unknown";
    default: {
      // RCD 側にステータスを足したらここでコンパイルが落ちる。PclodStatus も同時に更新する
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function isPclodCompleted(file: ContractFile): boolean {
  return derivePclodStatus(file.batchProcessingResult) === "completed";
}

export function deriveFileStatus(file: ContractFile, isPendingUpload: boolean): FileStatus {
  // クライアント側でアップロードを追跡中の行は、サーバーにまだ実体が無いので PCLOD 状態を持たない
  if (isPendingUpload) {
    return { upload: "uploading", pclod: "none" };
  }

  if (!isUploaded(file)) {
    return { upload: "uploading", pclod: "waiting" };
  }

  return { upload: "uploaded", pclod: derivePclodStatus(file.batchProcessingResult) };
}

/** ポーリングを続ける必要があるか。failed / unknown は確定状態なので止める */
export function isFileStatusActive(status: FileStatus): boolean {
  if (status.upload === "uploading") return true;

  switch (status.pclod) {
    case "waiting":
    case "processing":
      return true;
    case "none":
    case "completed":
    case "failed":
    case "unknown":
      return false;
    default: {
      const exhaustive: never = status.pclod;
      return exhaustive;
    }
  }
}
