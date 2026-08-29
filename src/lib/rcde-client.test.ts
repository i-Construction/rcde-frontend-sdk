import { describe, expect, it } from "vitest";
import { RCDEClient } from "./rcde-client";

const contractId = 1;

/** RCD から届く契約ファイル一覧の生 JSON。batchProcessingResult は検証前なので型を緩めておく */
type RawListPayload = {
  contractFiles: {
    id: number;
    name: string;
    uploadedAt?: string;
    batchProcessingResult?: unknown;
  }[];
};

function createClient(payload: RawListPayload) {
  const fetchImpl = (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as Response) as typeof fetch;

  return new RCDEClient({ baseUrl: "https://example.com", fetchImpl });
}

/** バッチ処理結果だけを差し替えた 1 件の一覧レスポンスを組み立てる */
function listPayloadWithBatchResult(batchProcessingResult: unknown): RawListPayload {
  return {
    contractFiles: [
      {
        id: 10,
        name: "sample.las",
        uploadedAt: "2024-11-19T06:56:31Z",
        batchProcessingResult,
      },
    ],
  };
}

async function fetchFirstBatchResult(batchProcessingResult: unknown) {
  const client = createClient(listPayloadWithBatchResult(batchProcessingResult));
  const { contractFiles } = await client.getContractFileList({ contractId });
  return contractFiles[0].batchProcessingResult;
}

describe("契約ファイル一覧のバッチ処理ステータス取り込み（getContractFileList）", () => {
  describe("正常系", () => {
    it("PCLOD が失敗したファイルは、失敗を表す 4 を保ったまま利用側へ渡す", async () => {
      const result = await fetchFirstBatchResult({ id: 100, status: 4 });

      expect(result).toEqual({ id: 100, status: 4 });
    });

    it("開始・進行中・完了のステータスも、RCD が返した数値をそのまま保つ", async () => {
      expect(await fetchFirstBatchResult({ id: 100, status: 1 })).toEqual({ id: 100, status: 1 });
      expect(await fetchFirstBatchResult({ id: 100, status: 2 })).toEqual({ id: 100, status: 2 });
      expect(await fetchFirstBatchResult({ id: 100, status: 3 })).toEqual({ id: 100, status: 3 });
    });

    it("バッチ処理がまだ始まっていないファイルは、バッチ処理結果を持たない", async () => {
      expect(await fetchFirstBatchResult(undefined)).toBeUndefined();
    });
  });

  describe("異常系", () => {
    it("RCD が SDK の知らないステータスを返したときは、unknown として生の数値を残す", async () => {
      const result = await fetchFirstBatchResult({ id: 100, status: 5 });

      expect(result).toEqual({ id: 100, status: "unknown", rawStatus: 5 });
    });

    it("RCD の定義に無い 0 も、完了や処理中に混ぜず unknown として扱う", async () => {
      const result = await fetchFirstBatchResult({ id: 100, status: 0 });

      expect(result).toEqual({ id: 100, status: "unknown", rawStatus: 0 });
    });

    it("ステータスが数値でないときは、バッチ処理結果そのものを取り込まない", async () => {
      expect(await fetchFirstBatchResult({ id: 100, status: "failed" })).toBeUndefined();
      expect(await fetchFirstBatchResult({ id: 100 })).toBeUndefined();
    });

    it("バッチ処理結果の id が欠けているときは、バッチ処理結果そのものを取り込まない", async () => {
      expect(await fetchFirstBatchResult({ status: 4 })).toBeUndefined();
    });
  });
});
