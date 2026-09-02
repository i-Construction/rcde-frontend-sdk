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

/** fetchImpl が受け取った 1 回分のリクエスト。URL は問い合わせ文字列まで含めた完全な形で控える */
type CapturedRequest = {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body: unknown;
};

type CaptureResponseOptions = {
  responsePayload?: unknown;
  ok?: boolean;
  status?: number;
};

type CapturingClientOptions = CaptureResponseOptions & {
  baseUrl?: string;
  authType?: AuthType;
  accessToken?: string;
};

/**
 * 送信本文の控え方。JSON 文字列は構造で比較できるよう解釈し、点群本体の ArrayBuffer や
 * ブロックチェーン送信の FormData はそのまま控える（String 化して JSON.parse すると落ちるため）
 */
function captureRequestBody(body: RequestInit["body"]): unknown {
  if (body === undefined || body === null) return undefined;
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/** 送信された URL・メソッド・ヘッダ・ボディを控える fetchImpl */
function createRequestCapture(options: CaptureResponseOptions = {}) {
  const { responsePayload = {}, ok = true, status = 200 } = options;
  const requests: CapturedRequest[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    requests.push({
      url: String(url),
      method: init?.method,
      headers: { ...(init?.headers as Record<string, string> | undefined) },
      body: captureRequestBody(init?.body),
    });
    return {
      ok,
      status,
      json: async () => responsePayload,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response;
  }) as unknown as typeof fetch;

  return { fetchImpl, requests };
}

/** fetchImpl を差し替えて、送信された URL・メソッド・ヘッダ・ボディを控えるクライアント */
function createRequestCapturingClient(options: CapturingClientOptions = {}) {
  const { baseUrl = "https://example.com", authType, accessToken, ...responseOptions } = options;
  const { fetchImpl, requests } = createRequestCapture(responseOptions);

  return {
    client: new RCDEClient({ baseUrl, fetchImpl, authType, accessToken }),
    requests,
  };
}

/**
 * 1 メソッドを呼んで、そのとき送信されたリクエストを返す。
 *
 * 応答の解釈で失敗しても捨てる。送信内容を写すテストが、送信と無関係な理由
 * （レスポンス変換のフォールバックが消えた等）で落ちると安全網としてノイズになるため。
 * リクエストが飛ばなければ件数の断言で落ちるので検出力は下がらない。
 * 併せて「1 メソッドの呼び出しで 1 回だけ送る」ことも固定する（二重送信の検出）。
 */
async function captureRequest(
  options: CapturingClientOptions,
  callMethod: (client: RCDEClient) => Promise<unknown>
): Promise<CapturedRequest> {
  const { client, requests } = createRequestCapturingClient(options);
  await callMethod(client).catch(() => undefined);
  expect(requests).toHaveLength(1);
  return requests[0];
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
        responsePayload: {
          contracts: [{ id: 7, name: "契約A", contractedAt: "2024-11-19T06:56:31Z", status: 2 }],
        },
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
      const { client, requests } = createRequestCapturingClient({ responsePayload: { id: 7 } });

      await client.createContract({
        constructionId: 1,
        name: "契約A",
        contractedAt: "2024-11-19T06:56:31Z",
      });

      expect(requests.map((request) => request.body)).toEqual([
        { constructionId: 1, name: "契約A", contractedAt: "2024-11-19T06:56:31Z" },
      ]);
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

// ここから下は「いま R-CDE へどんなリクエストを送っているか」を写し取って固定するテスト。
// HTTP 定型をヘルパーへ集約するリファクタで送信先が変わったら落ちるようにしておく
const AUTHENTICATED = "https://example.com/ext/v2/authenticated";
const USER_AUTHENTICATED = "https://example.com/ext/v2/userAuthenticated";

const contractFileId = 10;

describe("リクエスト送信先の組み立て（RCDEClient）", () => {
  describe("正常系", () => {
    it("2legged のクライアントで契約ファイル一覧を取得するとき、認証済みの契約ファイル一覧へ契約 ID 付きで問い合わせる", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractFileList({ contractId })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/contractFile?contractId=1`);
    });

    it("3legged のクライアントで契約ファイル一覧を取得するとき、ユーザー認証済みの契約ファイル一覧へ問い合わせる", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileList({ contractId })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contractFile?contractId=1`);
    });

    it("点群のメタデータを取得するとき、PCLOD メタデータの取得先へ契約ファイル ID を渡す", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileMetadata({ contractId, contractFileId })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/pclod/meta?contractFileId=10`);
    });

    it("階層と区画を省いて位置画像を取得するとき、階層 0・区画 0-0-0 を既定として問い合わせる", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileImagePosition({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${USER_AUTHENTICATED}/pclod/imagePosition?contractFileId=10&level=0&addr=0-0-0`
      );
    });

    it("階層と区画を省いて色画像を取得するとき、位置画像と同じ既定で色画像の取得先へ問い合わせる", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileImageColor({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${USER_AUTHENTICATED}/pclod/imageColor?contractFileId=10&level=0&addr=0-0-0`
      );
    });

    it("階層と区画を指定して位置画像を取得するとき、指定した値がそのまま問い合わせに載る", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileImagePosition({ contractId, contractFileId, level: 2, addr: "1-2-3" })
      );

      expect(request.url).toBe(
        `${USER_AUTHENTICATED}/pclod/imagePosition?contractFileId=10&level=2&addr=1-2-3`
      );
    });

    it("ダウンロード URL を取得するとき、契約ファイル ID をパスの末尾に含めて問い合わせる", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileDownloadUrl(contractId, contractFileId)
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contractFile/downloadURL/10`);
    });

    it("現場一覧を取得するとき、問い合わせ文字列を付けずに現場の取得先へ問い合わせる", async () => {
      const request = await captureRequest({}, (client) => client.getConstructionList());

      expect(request.url).toBe(`${AUTHENTICATED}/construction`);
    });

    it("現場を 1 件取得するとき、現場 ID をパスの末尾に含めて問い合わせる", async () => {
      const request = await captureRequest({}, (client) => client.getConstruction(5));

      expect(request.url).toBe(`${AUTHENTICATED}/construction/5`);
    });

    it("現場を作成するとき、現場の取得先と同じ URL へ作成内容をそのまま送る", async () => {
      const request = await captureRequest({}, (client) =>
        client.createConstruction({ name: "現場A", address: "東京都" })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/construction`);
      expect(request.method).toBe("POST");
      expect(request.body).toEqual({ name: "現場A", address: "東京都" });
    });

    it("契約を作成するとき、契約の取得先と同じ URL へ問い合わせ文字列なしで送る", async () => {
      const request = await captureRequest({}, (client) =>
        client.createContract({
          constructionId: 1,
          name: "契約A",
          contractedAt: "2024-11-19T06:56:31Z",
        })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/contract`);
      expect(request.method).toBe("POST");
    });
  });
});

describe("接続先の組み立て（baseUrl）", () => {
  describe("正常系", () => {
    // 既定は空文字（rcde-client.ts の baseUrl ?? ""）で、URL は素朴な文字列連結で組み立てる。
    // 組み立てを URL 型に寄せると、この相対パスは絶対 URL でないため作れなくなる
    it("接続先を指定せずにクライアントを作ったとき、認証区分から始まる相対パスへ問い合わせる", async () => {
      const { fetchImpl, requests } = createRequestCapture();
      const client = new RCDEClient({ fetchImpl });

      await client.getConstructionList();

      expect(requests[0].url).toBe("/ext/v2/authenticated/construction");
    });

    it("接続先の末尾に / を付けてクライアントを作ったとき、区切りが重なった URL をそのまま送る", async () => {
      const request = await captureRequest({ baseUrl: "https://example.com/" }, (client) =>
        client.getConstructionList()
      );

      expect(request.url).toBe("https://example.com//ext/v2/authenticated/construction");
    });
  });
});

describe("応答本文の読み取り方（RCDEClient）", () => {
  describe("正常系", () => {
    // URL を固定するテストは URL しか見ず、失敗系のテストは本文を読む前に throw する。
    // 読み取りを JSON へ変えても他が全部通るので、戻り値の型でここだけを固定しておく
    it("位置画像を取得するとき、応答本文をバイナリのまま返す", async () => {
      const { client } = createRequestCapturingClient();

      const image = await client.getContractFileImagePosition({ contractId, contractFileId });

      expect(image).toBeInstanceOf(ArrayBuffer);
    });

    it("色画像を取得するとき、応答本文をバイナリのまま返す", async () => {
      const { client } = createRequestCapturingClient();

      const image = await client.getContractFileImageColor({ contractId, contractFileId });

      expect(image).toBeInstanceOf(ArrayBuffer);
    });
  });
});

describe("2legged のときだけ契約 ID を問い合わせに付ける挙動", () => {
  describe("正常系", () => {
    it("2legged で点群のメタデータを取得するとき、契約ファイル ID の後ろに契約 ID を付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractFileMetadata({ contractId, contractFileId })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/pclod/meta?contractFileId=10&contractId=1`);
    });

    it("3legged で点群のメタデータを取得するとき、契約 ID を問い合わせに付けない", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileMetadata({ contractId, contractFileId })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/pclod/meta?contractFileId=10`);
    });

    it("2legged で位置画像を取得するとき、階層と区画の後ろに契約 ID を付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractFileImagePosition({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${AUTHENTICATED}/pclod/imagePosition?contractFileId=10&level=0&addr=0-0-0&contractId=1`
      );
    });

    it("3legged で位置画像を取得するとき、契約 ID を問い合わせに付けない", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileImagePosition({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${USER_AUTHENTICATED}/pclod/imagePosition?contractFileId=10&level=0&addr=0-0-0`
      );
    });

    it("2legged で色画像を取得するとき、階層と区画の後ろに契約 ID を付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractFileImageColor({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${AUTHENTICATED}/pclod/imageColor?contractFileId=10&level=0&addr=0-0-0&contractId=1`
      );
    });

    it("3legged で色画像を取得するとき、契約 ID を問い合わせに付けない", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileImageColor({ contractId, contractFileId })
      );

      expect(request.url).toBe(
        `${USER_AUTHENTICATED}/pclod/imageColor?contractFileId=10&level=0&addr=0-0-0`
      );
    });

    it("2legged でダウンロード URL を取得するとき、パスの後ろに契約 ID だけを問い合わせとして付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractFileDownloadUrl(contractId, contractFileId)
      );

      expect(request.url).toBe(`${AUTHENTICATED}/contractFile/downloadURL/10?contractId=1`);
    });

    it("3legged でダウンロード URL を取得するとき、問い合わせを付けずパスだけで問い合わせる", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileDownloadUrl(contractId, contractFileId)
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contractFile/downloadURL/10`);
    });

    // 契約ファイル一覧だけは authType を見ずに常に契約 ID を付ける。他メソッドと条件が違うので固定しておく
    it("3legged で契約ファイル一覧を取得するときも、契約 ID は認証方式によらず問い合わせに付く", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractFileList({ contractId })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contractFile?contractId=1`);
    });
  });
});

describe("契約一覧の現場 ID 付与（getContractList）", () => {
  describe("正常系", () => {
    it("2legged で契約一覧を取得するとき、現場 ID を問い合わせに付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractList({ constructionId: 3 })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/contract?constructionId=3`);
    });

    it("3legged で 0 以外の現場 ID を指定して契約一覧を取得するとき、現場 ID を問い合わせに付ける", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractList({ constructionId: 3 })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contract?constructionId=3`);
    });

    it("2legged で現場 ID に 0 を指定して契約一覧を取得するとき、0 のまま問い合わせに付ける", async () => {
      const request = await captureRequest({}, (client) =>
        client.getContractList({ constructionId: 0 })
      );

      expect(request.url).toBe(`${AUTHENTICATED}/contract?constructionId=0`);
    });

    // 付与条件が `authType === "2legged" || constructionId` なので、3legged では 0 が falsy になり
    // 現場 ID が丸ごと落ちる。他メソッドの「2legged のときだけ付ける」とも違う唯一の形なので現状を写しておく
    it("3legged で現場 ID に 0 を指定して契約一覧を取得するとき、現場 ID が落ちて問い合わせ自体が付かない", async () => {
      const request = await captureRequest({ authType: "3legged" }, (client) =>
        client.getContractList({ constructionId: 0 })
      );

      expect(request.url).toBe(`${USER_AUTHENTICATED}/contract`);
    });
  });
});

// RCDEClient は点群アップロードの HTTP を pointCloudUpload へ委譲し、getApiPath / fetchImpl /
// getAuthHeaders の 3 つだけを渡す。pointCloudUpload.test.ts はこの 3 つをハードコードした偽物で
// 検証しているので、受け渡しが壊れても向こうでは落ちない。ここで実クライアント経由の送信を写しておく
const presignedURL = "https://storage.example.com/upload/abc123";
const uploadedContractFileId = 77;

/** 点群アップロードで送られたリクエストを、開始・本体送信・完了通知の順に控える */
async function captureUploadRequests(options: CapturingClientOptions = {}) {
  const { client, requests } = createRequestCapturingClient({
    ...options,
    responsePayload: { presignedURL, contractFileId: uploadedContractFileId },
  });

  await client
    .uploadContractFile({ contractId, name: "sample.las", buffer: new ArrayBuffer(8) })
    .catch(() => undefined);

  return requests;
}

describe("点群アップロードへの受け渡し（uploadContractFile）", () => {
  describe("正常系", () => {
    it("2legged で点群をアップロードするとき、認証済みのアップロード開始へ認証ヘッダ付きで送る", async () => {
      const requests = await captureUploadRequests({ accessToken: "token-123" });

      expect(requests[0].url).toBe(`${AUTHENTICATED}/contractFile/pointCloud`);
      expect(requests[0].method).toBe("POST");
      expect(requests[0].headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      });
    });

    it("3legged で点群をアップロードするとき、ユーザー認証済みのアップロード開始と完了通知へ送る", async () => {
      const requests = await captureUploadRequests({ authType: "3legged" });

      expect(requests[0].url).toBe(`${USER_AUTHENTICATED}/contractFile/pointCloud`);
      expect(requests[2].url).toBe(
        `${USER_AUTHENTICATED}/contractFile/uploaded/${uploadedContractFileId}`
      );
    });

    // プリサインド URL は R-CDE ではなくオブジェクトストレージ宛で、Authorization を付けると
    // 署名と食い違って弾かれる。全リクエストへ一律にヘッダを足す形へ寄せたときに落ちるようにしておく
    it("点群の本体をプリサインド URL へ送るとき、認証ヘッダを付けない", async () => {
      const requests = await captureUploadRequests({ accessToken: "token-123" });

      expect(requests[1].url).toBe(presignedURL);
      expect(requests[1].method).toBe("PUT");
      expect(requests[1].headers).toEqual({});
    });

    it("点群をアップロードするとき、開始・本体送信・完了通知の 3 回だけ送る", async () => {
      const requests = await captureUploadRequests();

      expect(requests.map((request) => request.url)).toEqual([
        `${AUTHENTICATED}/contractFile/pointCloud`,
        presignedURL,
        `${AUTHENTICATED}/contractFile/uploaded/${uploadedContractFileId}`,
      ]);
    });
  });
});

describe("リクエストヘッダの組み立て（RCDEClient）", () => {
  describe("正常系", () => {
    it("アクセストークンを渡したクライアントで取得するとき、認証ヘッダにそのトークンを載せる", async () => {
      const request = await captureRequest({ accessToken: "token-123" }, (client) =>
        client.getConstructionList()
      );

      expect(request.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      });
    });

    it("アクセストークンを渡していないクライアントで取得するとき、認証ヘッダを載せない", async () => {
      const request = await captureRequest({}, (client) => client.getConstructionList());

      expect(request.headers).toEqual({ "Content-Type": "application/json" });
    });
  });
});

describe("R-CDE が成功以外を返したときの扱い（RCDEClient）", () => {
  describe("異常系", () => {
    it("契約ファイル一覧の取得が 404 で返るとき、HTTP 404 で失敗する", async () => {
      const { client } = createRequestCapturingClient({ ok: false, status: 404 });

      await expect(client.getContractFileList({ contractId })).rejects.toThrow("HTTP 404");
    });

    it("位置画像の取得が 500 で返るとき、HTTP 500 で失敗する", async () => {
      const { client } = createRequestCapturingClient({ ok: false, status: 500 });

      await expect(
        client.getContractFileImagePosition({ contractId, contractFileId })
      ).rejects.toThrow("HTTP 500");
    });
  });
});
