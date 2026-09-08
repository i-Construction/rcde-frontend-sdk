import { describe, expect, it } from "vitest";
import { deriveFileStatus, isFileStatusActive, isPclodCompleted } from "./contractFileStatus";
import type { ContractFile } from "./rcde-client";

const uploadedAt = "2024-11-19T06:56:31Z";

/** API から取得した、アップロード済み・PCLOD 未着手のファイル */
const uploadedFile: ContractFile = {
  id: 1,
  name: "sample.las",
  uploadedAt,
};

/** API から取得した、PCLOD バッチ開始直後のファイル */
const pclodStartedFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 1, rawStatus: 1 },
};

/** API から取得した、PCLOD バッチ実行中のファイル */
const pclodProcessingFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 2, rawStatus: 2 },
};

/** API から取得した、PCLOD 処理完了のファイル */
const pclodCompletedFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 3, rawStatus: 3 },
};

/** API から取得した、PCLOD 処理が失敗したファイル */
const pclodFailedFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, status: 4, rawStatus: 4 },
};

/** R-CDE が SDK の知らないステータスを返し、unknown として取り込まれたファイル */
const pclodUnknownStatusFile: ContractFile = {
  ...uploadedFile,
  batchProcessingResult: { id: 100, rawStatus: 5 },
};

describe("契約ファイルの状態導出（deriveFileStatus / isFileStatusActive）", () => {
  describe("正常系", () => {
    it("クライアント側でアップロード追跡中は、アップロード：uploading、PCLOD：none とする", () => {
      const status = deriveFileStatus({ id: 10, name: "uploading.las" }, true);

      expect(status).toEqual({ upload: "uploading", pclod: "none" });
      expect(isFileStatusActive(status)).toBe(true);
    });

    it("サーバー側アップロード未完了（uploadedAt なし）は、アップロード：uploading、PCLOD：waiting とする", () => {
      const status = deriveFileStatus({ id: 10, name: "registering.las" }, false);

      expect(status).toEqual({ upload: "uploading", pclod: "waiting" });
      expect(isFileStatusActive(status)).toBe(true);
    });

    it("アップロード完了後・PCLOD 未着手は、アップロード：uploaded、PCLOD：waiting とする", () => {
      const status = deriveFileStatus(uploadedFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "waiting" });
      expect(isFileStatusActive(status)).toBe(true);
    });

    it("PCLOD バッチ開始直後は、アップロード：uploaded、PCLOD：processing とする", () => {
      const status = deriveFileStatus(pclodStartedFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "processing" });
      expect(isFileStatusActive(status)).toBe(true);
    });

    it("PCLOD バッチ実行中は、アップロード：uploaded、PCLOD：processing とする", () => {
      const status = deriveFileStatus(pclodProcessingFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "processing" });
      expect(isFileStatusActive(status)).toBe(true);
    });

    it("PCLOD 処理完了後は、アップロード：uploaded、PCLOD：completed とする", () => {
      const status = deriveFileStatus(pclodCompletedFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "completed" });
      expect(isFileStatusActive(status)).toBe(false);
    });

    it("PCLOD 処理が完了したファイルは、表示可能（PCLOD 完了）とみなす", () => {
      expect(isPclodCompleted(pclodCompletedFile)).toBe(true);
    });

    it("PCLOD が未着手・開始直後・実行中のファイルは、まだ表示可能とみなさない", () => {
      expect(isPclodCompleted(uploadedFile)).toBe(false);
      expect(isPclodCompleted(pclodStartedFile)).toBe(false);
      expect(isPclodCompleted(pclodProcessingFile)).toBe(false);
    });
  });

  describe("異常系", () => {
    it("PCLOD 処理が失敗したときは、アップロード：uploaded、PCLOD：failed とする", () => {
      const status = deriveFileStatus(pclodFailedFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "failed" });
      expect(isFileStatusActive(status)).toBe(false);
    });

    it("PCLOD 処理が失敗したファイルは、表示可能（PCLOD 完了）とみなさない", () => {
      expect(isPclodCompleted(pclodFailedFile)).toBe(false);
    });

    it("R-CDE が SDK の知らないステータスを返したときは、アップロード：uploaded、PCLOD：unknown とし、待ち続けない", () => {
      const status = deriveFileStatus(pclodUnknownStatusFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "unknown" });
      expect(isFileStatusActive(status)).toBe(false);
    });

    it("R-CDE が SDK の知らないステータスを返したファイルは、表示可能（PCLOD 完了）とみなさない", () => {
      expect(isPclodCompleted(pclodUnknownStatusFile)).toBe(false);
    });

    it("前回失敗したファイルを再アップロード中のあいだは、失敗ではなくアップロード追跡中の状態を出す", () => {
      const status = deriveFileStatus(pclodFailedFile, true);

      expect(status).toEqual({ upload: "uploading", pclod: "none" });
      expect(isFileStatusActive(status)).toBe(true);
    });
  });
});

describe("契約ファイルの状態がアクティブかどうかの判定（isFileStatusActive）", () => {
  it("PCLOD が processing のときは true である", () => {
    expect(isFileStatusActive({ upload: "uploaded", pclod: "processing" })).toBe(true);
  });

  it("PCLOD が waiting のときは true である", () => {
    expect(isFileStatusActive({ upload: "uploaded", pclod: "waiting" })).toBe(true);
  });

  it("アップロードが uploading のときは true である", () => {
    expect(isFileStatusActive({ upload: "uploading", pclod: "none" })).toBe(true);
  });

  it("PCLOD が completed のときは false である", () => {
    expect(isFileStatusActive({ upload: "uploaded", pclod: "completed" })).toBe(false);
  });

  it("PCLOD が failed のときは false である", () => {
    expect(isFileStatusActive({ upload: "uploaded", pclod: "failed" })).toBe(false);
  });

  it("PCLOD が unknown のときは false である", () => {
    expect(isFileStatusActive({ upload: "uploaded", pclod: "unknown" })).toBe(false);
  });
});
