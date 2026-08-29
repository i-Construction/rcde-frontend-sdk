import { describe, expect, it } from "vitest";
import { deriveFileStatus, isFileStatusActive } from "./contractFileStatus";
import { RCDEClient, type AuthType } from "./rcde-client";

const contractId = 1;

/** R-CDE から届く契約ファイル一覧の生 JSON。batchProcessingResult は検証前なので型を緩めておく */
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

/** 送信されたリクエストを控えるクライアント。URL・ヘッダの検証は本 PR のスコープ外なので body だけ見る */
function createRequestCapturingClient(responsePayload: unknown, authType: AuthType = "2legged") {
  const sentBodies: unknown[] = [];
  const fetchImpl = (async (_url: string, init?: RequestInit) => {
    sentBodies.push(init?.body === undefined ? undefined : JSON.parse(String(init.body)));
    return {
      ok: true,
      status: 200,
      json: async () => responsePayload,
    } as Response;
  }) as unknown as typeof fetch;

  return {
    client: new RCDEClient({ baseUrl: "https://example.com", fetchImpl, authType }),
    sentBodies,
  };
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

async function fetchFirstContractFile(batchProcessingResult: unknown) {
  const client = createClient(listPayloadWithBatchResult(batchProcessingResult));
  const { contractFiles } = await client.getContractFileList({ contractId });
  return contractFiles[0];
}

async function fetchFirstBatchResult(batchProcessingResult: unknown) {
  const contractFile = await fetchFirstContractFile(batchProcessingResult);
  return contractFile.batchProcessingResult;
}

describe("契約ファイル一覧のバッチ処理ステータス取り込み（getContractFileList）", () => {
  describe("正常系", () => {
    it("PCLOD が失敗したファイルは、失敗を表す 4 を保ったまま利用側へ渡す", async () => {
      const batchResult = await fetchFirstBatchResult({ id: 100, status: 4 });

      expect(batchResult).toEqual({ id: 100, status: 4, rawStatus: 4 });
    });

    it("開始・進行中・完了のステータスも、R-CDE が返した数値をそのまま保つ", async () => {
      expect(await fetchFirstBatchResult({ id: 100, status: 1 })).toEqual({
        id: 100,
        status: 1,
        rawStatus: 1,
      });
      expect(await fetchFirstBatchResult({ id: 100, status: 2 })).toEqual({
        id: 100,
        status: 2,
        rawStatus: 2,
      });
      expect(await fetchFirstBatchResult({ id: 100, status: 3 })).toEqual({
        id: 100,
        status: 3,
        rawStatus: 3,
      });
    });

    it("バッチ処理がまだ始まっていないファイルは、バッチ処理結果を持たない", async () => {
      expect(await fetchFirstBatchResult(undefined)).toBeUndefined();
    });
  });

  describe("異常系", () => {
    it("R-CDE が SDK の知らないステータスを返したときは、ステータスを持たせず生の数値を残す", async () => {
      const batchResult = await fetchFirstBatchResult({ id: 100, status: 5 });

      expect(batchResult).toEqual({ id: 100, status: undefined, rawStatus: 5 });
    });

    it("R-CDE の定義に無い 0 も、完了や処理中に混ぜずステータス無しとして扱う", async () => {
      const batchResult = await fetchFirstBatchResult({ id: 100, status: 0 });

      expect(batchResult).toEqual({ id: 100, status: undefined, rawStatus: 0 });
    });

    it("ステータスが数値でないときは、バッチ処理結果そのものを取り込まない", async () => {
      expect(await fetchFirstBatchResult({ id: 100, status: "failed" })).toBeUndefined();
      expect(await fetchFirstBatchResult({ id: 100 })).toBeUndefined();
    });

    it("バッチ処理結果の id が欠けているときは、バッチ処理結果そのものを取り込まない", async () => {
      expect(await fetchFirstBatchResult({ status: 4 })).toBeUndefined();
    });

    it("バッチ処理結果が null で届いても、一覧取得ごと失敗させない", async () => {
      await expect(fetchFirstBatchResult(null)).resolves.toBeUndefined();
    });
  });
});

describe("契約一覧のステータス取り込み（getContractList）", () => {
  describe("正常系", () => {
    it("承認済みの契約が届いたとき、承認状態を表す 2 を数値のまま利用側へ渡す", async () => {
      const { client } = createRequestCapturingClient({
        contracts: [{ id: 7, name: "契約A", contractedAt: "2024-11-19T06:56:31Z", status: 2 }],
      });

      const { contracts } = await client.getContractList({ constructionId: 1 });

      expect(contracts[0].status).toBe(2);
    });
  });
});

describe("契約作成リクエストの組み立て（createContract）", () => {
  describe("正常系", () => {
    // R-CDE の ContractCreateFor2LeggedParams / ContractCreateFor3LeggedParams に status が無く、
    // 送っても echo の Bind に捨てられる。SDK 側から status を送らないことを固定する
    it("契約を作成するとき、R-CDE が受け取らないステータスはリクエストに載せない", async () => {
      const { client, sentBodies } = createRequestCapturingClient({ id: 7 });

      await client.createContract({
        constructionId: 1,
        name: "契約A",
        contractedAt: "2024-11-19T06:56:31Z",
        unitPrice: 1000,
        unitVolume: 5,
      });

      expect(sentBodies).toEqual([
        {
          constructionId: 1,
          name: "契約A",
          contractedAt: "2024-11-19T06:56:31Z",
          unitPrice: 1000,
          unitVolume: 5,
        },
      ]);
    });

    // R-CDE は UnitPrice / UnitVolume を validate:"required" にしており、送らないと必ず 400 になる
    it("単価と数量を指定して契約を作成するとき、その 2 つをリクエストに載せる", async () => {
      const { client, sentBodies } = createRequestCapturingClient({ id: 7 });

      await client.createContract({
        constructionId: 1,
        name: "契約A",
        contractedAt: "2024-11-19T06:56:31Z",
        unitPrice: 1000,
        unitVolume: 5,
      });

      expect(sentBodies[0]).toMatchObject({ unitPrice: 1000, unitVolume: 5 });
    });

    it("3legged で相手先メールを指定して契約を作成するとき、そのメールをリクエストに載せる", async () => {
      const { client, sentBodies } = createRequestCapturingClient({ id: 7 }, "3legged");

      await client.createContract({
        constructionId: 1,
        name: "契約A",
        contractedAt: "2024-11-19T06:56:31Z",
        unitPrice: 1000,
        unitVolume: 5,
        contracteeEmail: "contractee@example.com",
      });

      expect(sentBodies[0]).toMatchObject({ contracteeEmail: "contractee@example.com" });
    });

    // 2legged は受注者がダミー企業として自動設定されるため、R-CDE 側もメールを要求しない
    it("2legged で契約を作成するとき、相手先メールが無くてもリクエストを送る", async () => {
      const { client, sentBodies } = createRequestCapturingClient({ id: 7 });

      await client.createContract({
        constructionId: 1,
        name: "契約A",
        contractedAt: "2024-11-19T06:56:31Z",
        unitPrice: 1000,
        unitVolume: 5,
      });

      expect(sentBodies).toHaveLength(1);
    });
  });

  describe("異常系", () => {
    // R-CDE の ContractCreateFor3LeggedParams は required_without で相互必須。送っても必ず 400 になるので、
    // HTTP 400 ではなく原因の分かるエラーで手前から止める
    it("3legged で相手先メールをどちらも指定しないとき、リクエストを送らずに失敗する", async () => {
      const { client, sentBodies } = createRequestCapturingClient({ id: 7 }, "3legged");

      await expect(
        client.createContract({
          constructionId: 1,
          name: "契約A",
          contractedAt: "2024-11-19T06:56:31Z",
          unitPrice: 1000,
          unitVolume: 5,
        })
      ).rejects.toThrow("contracteeEmail か contractorEmail のどちらかが必要です");
      expect(sentBodies).toHaveLength(0);
    });
  });
});

describe("取り込んだステータスからポーリング継続判断まで（getContractFileList → deriveFileStatus → isFileStatusActive）", () => {
  describe("異常系", () => {
    it("R-CDE が SDK の知らない数値を返したファイルは、不明として扱いポーリングを止める", async () => {
      const contractFile = await fetchFirstContractFile({ id: 100, status: 5 });

      const status = deriveFileStatus(contractFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "unknown" });
      expect(isFileStatusActive(status)).toBe(false);
    });

    // 未知の「数値」は unknown で止まるのに、数値でない「型」はバッチ処理結果ごと落ちて waiting
    // に見えるため止まらない、という非対称がある。R-CDE の BatchProcessingResultDetailResponse
    // は `Status uint8 json:"status"`（omitempty なし）なので、この経路は R-CDE からは発生しない。
    // 実装は変えず、いまの挙動をテストとして残しておく
    it("ステータスが数値でないファイルは、待機中と区別できずポーリングを止められない", async () => {
      const contractFile = await fetchFirstContractFile({ id: 100, status: "failed" });

      const status = deriveFileStatus(contractFile, false);

      expect(status).toEqual({ upload: "uploaded", pclod: "waiting" });
      expect(isFileStatusActive(status)).toBe(true);
    });
  });
});
