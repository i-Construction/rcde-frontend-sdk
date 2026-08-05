import type { ContractFile } from "./rcde-client";

export type UploadStatus = "uploading" | "uploaded";
export type PclodStatus = "none" | "waiting" | "processing" | "completed" | "failed";

export type FileStatus = {
  upload: UploadStatus;
  pclod: PclodStatus;
};

export type PendingUpload = {
  name: string;
};

export type PendingUploads = Record<number, PendingUpload>;

const BATCH_STATUS_COMPLETED = 3;
const BATCH_STATUS_FAILED = 4;

function isUploaded(file: ContractFile): boolean {
  return file.uploadedAt !== undefined && file.uploadedAt.length > 0;
}

function isPclodCompleted(file: ContractFile): boolean {
  const batchStatus = file.batchProcessingResult?.status;
  return batchStatus === BATCH_STATUS_COMPLETED;
}

export { isPclodCompleted };

function isPclodFailed(file: ContractFile): boolean {
  const batchStatus = file.batchProcessingResult?.status;
  return batchStatus === BATCH_STATUS_FAILED;
}

function isPclodProcessing(file: ContractFile): boolean {
  const batchStatus = file.batchProcessingResult?.status;
  if (batchStatus === undefined) {
    return false;
  }
  if (batchStatus === BATCH_STATUS_COMPLETED || batchStatus === BATCH_STATUS_FAILED) {
    return false;
  }
  return true;
}

export function deriveFileStatus(file: ContractFile, isPendingUpload: boolean): FileStatus {
  if (isPendingUpload) {
    return {
      upload: "uploading",
      pclod: "none",
    };
  }

  const uploaded = isUploaded(file);
  if (!uploaded) {
    return {
      upload: "uploading",
      pclod: "waiting",
    };
  }

  if (isPclodFailed(file)) {
    return {
      upload: "uploaded",
      pclod: "failed",
    };
  }

  if (isPclodCompleted(file)) {
    return {
      upload: "uploaded",
      pclod: "completed",
    };
  }

  if (isPclodProcessing(file)) {
    return {
      upload: "uploaded",
      pclod: "processing",
    };
  }

  return {
    upload: "uploaded",
    pclod: "waiting",
  };
}

export function isFileStatusActive(status: FileStatus): boolean {
  const isUploadActive = status.upload === "uploading";
  const isPclodActive = status.pclod === "waiting" || status.pclod === "processing";
  return isUploadActive || isPclodActive;
}
