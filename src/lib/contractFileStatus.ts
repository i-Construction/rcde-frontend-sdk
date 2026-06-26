import type { ContractFile } from "./rcde-client";

export type UploadStatusLabel = "アップロード中" | "完了";
export type PclodStatusLabel = "待機中" | "処理中" | "完了" | "不明" | "-";

export type PendingUpload = {
  name: string;
};

export type PendingUploads = Record<number, PendingUpload>;

export type FileStatusLabels = {
  upload: UploadStatusLabel;
  pclod: PclodStatusLabel;
};

const BATCH_STATUS_COMPLETED = 3;

function isUploaded(file: ContractFile): boolean {
  return file.uploadedAt !== undefined && file.uploadedAt.length > 0;
}

function hasUnknownBatchStatus(file: ContractFile): boolean {
  return file.hasUnknownBatchStatus === true;
}

function isPclodCompleted(file: ContractFile): boolean {
  if (hasUnknownBatchStatus(file)) {
    return false;
  }
  const batchStatus = file.batchProcessingResult?.status;
  return batchStatus === BATCH_STATUS_COMPLETED;
}

export { isPclodCompleted };

function isPclodProcessing(file: ContractFile): boolean {
  if (hasUnknownBatchStatus(file)) {
    return false;
  }
  const batchStatus = file.batchProcessingResult?.status;
  if (batchStatus === undefined) {
    return false;
  }
  if (batchStatus === BATCH_STATUS_COMPLETED) {
    return false;
  }
  return true;
}

export function deriveFileStatusLabels(
  file: ContractFile,
  isPendingUpload: boolean
): FileStatusLabels {
  if (isPendingUpload) {
    return {
      upload: "アップロード中",
      pclod: "-",
    };
  }

  const uploaded = isUploaded(file);
  if (!uploaded) {
    return {
      upload: "アップロード中",
      pclod: "待機中",
    };
  }

  if (hasUnknownBatchStatus(file)) {
    return {
      upload: "完了",
      pclod: "不明",
    };
  }

  if (isPclodCompleted(file)) {
    return {
      upload: "完了",
      pclod: "完了",
    };
  }

  if (isPclodProcessing(file)) {
    return {
      upload: "完了",
      pclod: "処理中",
    };
  }

  return {
    upload: "完了",
    pclod: "待機中",
  };
}

export function isFileStatusActive(labels: FileStatusLabels): boolean {
  const isUploadActive = labels.upload === "アップロード中";
  const isPclodActive = labels.pclod === "待機中" || labels.pclod === "処理中";
  return isUploadActive || isPclodActive;
}

export function needsPolling(files: ContractFile[], pendingUploads: PendingUploads): boolean {
  const pendingUploadIds = Object.keys(pendingUploads);
  const hasPendingUploads = pendingUploadIds.length > 0;
  if (hasPendingUploads) {
    return true;
  }

  for (const file of files) {
    if (hasUnknownBatchStatus(file)) {
      continue;
    }
    const uploaded = isUploaded(file);
    if (!uploaded) {
      return true;
    }
    if (!isPclodCompleted(file)) {
      return true;
    }
  }

  return false;
}
