import { describe, expect, it } from "vitest";
import {
  deriveFileStatusLabels,
  isFileStatusActive,
  needsPolling,
} from "./contractFileStatus";
import type { ContractFile } from "./rcde-client";

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

describe("契約ファイル一覧に表示する状態ラベル", () => {
  it("クライアント側でアップロード追跡中は、アップロード：アップロード中、PCLOD：-として表示する", () => {
    const labels = deriveFileStatusLabels(
      { id: 10, name: "uploading.las" },
      true
    );

    expect(labels).toEqual({ upload: "アップロード中", pclod: "-" });
    expect(isFileStatusActive(labels)).toBe(true);
  });

  it("サーバー側アップロード未完了（uploadedAt なし）は、アップロード：アップロード中、PCLOD：待機中として表示する", () => {
    const labels = deriveFileStatusLabels(
      { id: 10, name: "registering.las" },
      false
    );

    expect(labels).toEqual({ upload: "アップロード中", pclod: "待機中" });
    expect(isFileStatusActive(labels)).toBe(true);
  });

  it("アップロード完了後・PCLOD 未着手は、アップロード：完了、PCLOD：待機中として表示する", () => {
    const labels = deriveFileStatusLabels(uploadedFile, false);

    expect(labels).toEqual({ upload: "完了", pclod: "待機中" });
    expect(isFileStatusActive(labels)).toBe(true);
  });

  it("PCLOD バッチ実行中は、アップロード：完了、PCLOD：処理中として表示する", () => {
    const labels = deriveFileStatusLabels(pclodProcessingFile, false);

    expect(labels).toEqual({ upload: "完了", pclod: "処理中" });
    expect(isFileStatusActive(labels)).toBe(true);
  });

  it("PCLOD 処理完了後は、アップロード：完了、PCLOD：完了として表示する", () => {
    const labels = deriveFileStatusLabels(pclodCompletedFile, false);

    expect(labels).toEqual({ upload: "完了", pclod: "完了" });
    expect(isFileStatusActive(labels)).toBe(false);
  });
});

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
});
