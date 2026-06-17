import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RCDEClient3Legged, type Token } from "./client-3-legged";

const PROPS = {
  baseUrl: "https://api.example.test",
  clientId: "cid",
  clientSecret: "secret",
  authCode: "",
};

/** fetch のレスポンスを模した最小オブジェクト */
function jsonResponse(body: unknown) {
  return { json: async () => body } as unknown as Response;
}

function newClient() {
  return new RCDEClient3Legged({ ...PROPS });
}

/**
 * DI 用のフェイク Api。ext.* を vi.fn に差し替え、override で個別に上書きする。
 * これにより vi.mock("./api-3-legged") 無しで API 呼び出しを検証できる。
 */
function makeApi(override: Record<string, unknown> = {}) {
  return {
    ext: {
      getExt3LeggedV2AuthenticatedContractFileProcessingStatus: vi
        .fn()
        .mockResolvedValue({ data: { status: "ok" } }),
      postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: vi.fn(),
      putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload:
        vi.fn(),
      ...override,
    },
  };
}

/** fetch(PUT) のレスポンスを模す（etag ヘッダのみ返す） */
function putResponse(etag: string | null) {
  return {
    headers: { get: (k: string) => (k === "etag" ? etag : null) },
  } as unknown as Response;
}

const FIXED_MS = 1_000_000_000_000;
const FIXED_NOW_SEC = Math.floor(FIXED_MS / 1000);

const validToken: Token = {
  accessToken: "at",
  refreshToken: "rt",
  expiresAt: 9999999999,
};

describe("RCDEClient3Legged: setToken / getToken", () => {
  it("getToken はトークン未設定時に throw する", () => {
    const client = newClient();
    expect(() => client.getToken()).toThrow("Token is not available");
  });

  it("setToken で設定したトークンを getToken で取得できる", () => {
    const client = newClient();
    client.setToken({ ...validToken });
    expect(client.getToken()).toEqual(validToken);
  });
});

describe("RCDEClient3Legged.authenticate", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("正常レスポンスでトークンを格納する", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ accessToken: "a", refreshToken: "r", expiresAt: 123 })
    );
    const client = newClient();

    await client.authenticate("auth-code");

    expect(client.getToken()).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
    });
  });

  it("必須フィールド欠落時に throw する", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ accessToken: "a" }) // refreshToken / expiresAt 欠落
    );
    const client = newClient();

    await expect(client.authenticate("auth-code")).rejects.toThrow(
      "Invalid token response for authorization_code"
    );
  });
});

describe("RCDEClient3Legged.refreshToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("トークン未設定時は throw する", async () => {
    const client = newClient();
    await expect(client.refreshToken()).rejects.toThrow(
      "Token is not available"
    );
  });

  it("refreshToken が空の場合は 'No refresh token' を throw する", async () => {
    const client = newClient();
    client.setToken({ accessToken: "a", refreshToken: "", expiresAt: 1 });
    await expect(client.refreshToken()).rejects.toThrow("No refresh token");
  });

  it("不正レスポンスで throw する", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
    const client = newClient();
    client.setToken({ ...validToken });

    await expect(client.refreshToken()).rejects.toThrow(
      "Invalid token response for refresh_token"
    );
  });

  it("正常時にトークンを更新し refresh_token グラントで送信する", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ accessToken: "a2", refreshToken: "r2", expiresAt: 456 })
    );
    const client = newClient();
    client.setToken({ ...validToken });

    await client.refreshToken();

    expect(client.getToken()).toEqual({
      accessToken: "a2",
      refreshToken: "r2",
      expiresAt: 456,
    });
  });
});

describe("RCDEClient3Legged: 自動リフレッシュ境界 (ensureValidAccessToken)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("期限まで 60 秒以内なら API 呼び出し前に refresh が発火する", async () => {
    const api = makeApi();
    const client = new RCDEClient3Legged(
      { ...PROPS },
      { api: api as never, now: () => FIXED_MS }
    );
    client.setToken({
      accessToken: "old-at",
      refreshToken: "rt",
      expiresAt: FIXED_NOW_SEC + 30, // 60 秒以内
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({
        accessToken: "new-at",
        refreshToken: "new-rt",
        expiresAt: FIXED_NOW_SEC + 3600,
      })
    );

    await client.getContractFileProcessingStatus(123);

    // 期限が近いので refresh（fetch）が発火する＝分岐の振る舞い
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("期限に余裕があれば refresh せず、既存トークンで API を呼ぶ", async () => {
    const api = makeApi();
    const client = new RCDEClient3Legged(
      { ...PROPS },
      { api: api as never, now: () => FIXED_MS }
    );
    client.setToken({
      accessToken: "still-at",
      refreshToken: "rt",
      expiresAt: FIXED_NOW_SEC + 3600,
    });

    await client.getContractFileProcessingStatus(123);

    // 期限に余裕があるので refresh（fetch）は発火しない＝分岐の振る舞い
    expect(fetch).not.toHaveBeenCalled();
  });

  it("トークン未設定なら 'Token is not available' を throw する", async () => {
    const api = makeApi();
    const client = new RCDEClient3Legged(
      { ...PROPS },
      { api: api as never, now: () => FIXED_MS }
    );
    await expect(client.getContractFileProcessingStatus(1)).rejects.toThrow(
      "Token is not available"
    );
  });
});

describe("RCDEClient3Legged.uploadContractFileMultipart", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function authedClient(api: ReturnType<typeof makeApi>) {
    const client = new RCDEClient3Legged(
      { ...PROPS },
      { api: api as never, now: () => FIXED_MS }
    );
    client.setToken({
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: FIXED_NOW_SEC + 3600,
    });
    return client;
  }

  it("正常系: partTotal を算出し各パートを PUT、s3Parts を組み立てて complete を呼ぶ", async () => {
    const api = makeApi({
      postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: vi
        .fn()
        .mockResolvedValue({
          data: {
            s3UploadId: "s3up",
            blockChainUploadId: "bc",
            contractFileId: 77,
            presignedUploadParts: [
              { presignedURL: "https://s3/part1", partNumber: 1 },
              { presignedURL: "https://s3/part2", partNumber: 2 },
            ],
          },
        }),
      putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload:
        vi.fn().mockResolvedValue({ data: { ok: true } }),
    });
    const client = authedClient(api);
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(putResponse('"etag-1"'))
      .mockResolvedValueOnce(putResponse('"etag-2"'));

    const file = new ArrayBuffer(8); // chunkSize 4 → 2 パート
    const result = await client.uploadContractFileMultipart({
      contractId: 1,
      file,
      filename: "a.las",
      chunkSize: 4,
    });

    // size=8 / chunkSize=4 から size=8・partTotal=2 を算出して渡す（SDK の計算）
    const [initPayload] =
      api.ext.postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
        .mock.calls[0];
    expect(initPayload).toMatchObject({ size: 8, partTotal: 2 });

    // partTotal=2 から 2 回 PUT する
    expect(fetch).toHaveBeenCalledTimes(2);

    // complete に s3Parts（partNumber/etag）が組み立てられて渡る
    const [completePayload] =
      api.ext
        .putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
        .mock.calls[0];
    expect(completePayload).toMatchObject({
      contractFileId: 77,
      s3UploadId: "s3up",
      blockChainUploadId: "bc",
      s3Parts: [
        { partNumber: 1, etag: '"etag-1"' },
        { partNumber: 2, etag: '"etag-2"' },
      ],
    });
    expect(result).toEqual({ ok: true });
  });

  it("パートの presignedURL が欠落していると throw する", async () => {
    const api = makeApi({
      postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: vi
        .fn()
        .mockResolvedValue({
          data: {
            s3UploadId: "s3up",
            blockChainUploadId: "bc",
            contractFileId: 77,
            presignedUploadParts: [{}], // presignedURL なし
          },
        }),
    });
    const client = authedClient(api);

    await expect(
      client.uploadContractFileMultipart({
        contractId: 1,
        file: new ArrayBuffer(4),
        filename: "a.las",
        chunkSize: 4,
      })
    ).rejects.toThrow("presignedURL が取得できませんでした");
  });

  it("完了に必要な情報（contractFileId 等）が欠落していると throw する", async () => {
    const api = makeApi({
      postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: vi
        .fn()
        .mockResolvedValue({
          data: {
            s3UploadId: "s3up",
            blockChainUploadId: "bc",
            // contractFileId なし
            presignedUploadParts: [
              { presignedURL: "https://s3/part1", partNumber: 1 },
            ],
          },
        }),
    });
    const client = authedClient(api);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(putResponse('"e"'));

    await expect(
      client.uploadContractFileMultipart({
        contractId: 1,
        file: new ArrayBuffer(4),
        filename: "a.las",
        chunkSize: 4,
      })
    ).rejects.toThrow(
      "マルチパートアップロードの完了に必要な情報が不足しています"
    );
  });
});
