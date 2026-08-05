import { describe, expect, it } from "vitest";
import { needsPolling } from "./contractFileStatus";
import type { ContractFile } from "./rcde-client";

// ステータス判定（deriveFileStatusLabels / isFileStatusActive）のテストは
// src/hooks/useContractFileActions.test.ts の「2 ステータス判定」へ移動した。

const uploadedAt = "2024-11-19T06:56:31Z";

/** API から取得した、アップロード済み・PCLOD 未着手のファイル */
const uploadedFile: ContractFile = {
  id: 1,
  name: "sample.las",
  uploadedAt,
};

/** API から取得した、PCLOD バッチ実行中のファイル */
const pclodProcessingFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 2 },
};

/** API から取得した、PCLOD 処理完了のファイル */
const pclodCompletedFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 3 },
};

/** batchProcessingResult.status が RCDE 既知値以外のファイル */
const unknownBatchStatusFile: ContractFile = {
  ...uploadedFile,
  hasUnknownBatchStatus: true,
};

describe("契約ファイル一覧の自動更新", () => {
  it("表示対象がなく、進行中の処理もないときは更新を止める", () => {
    expect(needsPolling([], {})).toBe(false);
  });

  it("クライアント側でアップロード追跡中のファイルがあるときは更新を続ける", () => {
    expect(needsPolling([], { 42: { name: "uploading.las" } })).toBe(true);
  });

  it("uploadedAt がないファイル（サーバー側アップロード未完了）が残っているときは更新を続ける", () => {
    expect(needsPolling([{ id: 1, name: "registering.las" }], {})).toBe(true);
  });

  it("PCLOD が未完了のファイルがあるときは更新を続ける", () => {
    expect(needsPolling([uploadedFile], {})).toBe(true);
    expect(needsPolling([pclodProcessingFile], {})).toBe(true);
  });

  it("全ファイルが PCLOD 完了のときは更新を止める", () => {
    expect(needsPolling([pclodCompletedFile], {})).toBe(false);
  });

  it("batchProcessingResult.status が既知値以外のファイルのみのときは更新を止める", () => {
    expect(needsPolling([unknownBatchStatusFile], {})).toBe(false);
  });
});
