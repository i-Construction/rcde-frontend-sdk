import { describe, expect, it } from "vitest";
import { BATCH_PROCESSING_STATUS, isBatchProcessingStatus } from "./batchProcessingStatus";

describe("RCD の PCLOD バッチ処理ステータスとの同期（BATCH_PROCESSING_STATUS / isBatchProcessingStatus）", () => {
  describe("正常系", () => {
    it("RCD の server/pkg/ent/schema/batchprocessingresult.go と同じ 開始:1 / 進行中:2 / 完了:3 / 失敗:4 を持つ", () => {
      expect(BATCH_PROCESSING_STATUS).toEqual({
        start: 1,
        inProgress: 2,
        finish: 3,
        failed: 4,
      });
    });

    it("RCD が定義している 1 から 4 までの値は、既知のステータスとして受け入れる", () => {
      expect([1, 2, 3, 4].every(isBatchProcessingStatus)).toBe(true);
    });
  });

  describe("異常系", () => {
    it("RCD に存在しない数値は、既知のステータスとして受け入れない", () => {
      expect(isBatchProcessingStatus(0)).toBe(false);
      expect(isBatchProcessingStatus(5)).toBe(false);
      expect(isBatchProcessingStatus(-1)).toBe(false);
    });

    it("数値以外が届いたときは、既知のステータスとして受け入れない", () => {
      expect(isBatchProcessingStatus("4")).toBe(false);
      expect(isBatchProcessingStatus(undefined)).toBe(false);
      expect(isBatchProcessingStatus(null)).toBe(false);
    });
  });
});
