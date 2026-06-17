import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * RCDEClient2Legged は内部で `new Api(...)` を生成するため、
 * api-2-legged モジュールをモックして ext.* メソッドを vi.fn に差し替える。
 */
const ext = {
  postExtV2AuthToken: vi.fn(),
  postExtV2AuthenticatedConstruction: vi.fn(),
  postExtV2AuthenticatedContract: vi.fn(),
  postExtV2AuthenticatedContractFilePointCloud: vi.fn(),
  putExtV2AuthenticatedContractFileUploaded: vi.fn(),
};

vi.mock("./api-2-legged", () => {
  return {
    Api: class {
      ext = ext;
      constructor(_config?: unknown) {}
    },
  };
});

// モック設定後に import する
import { RCDEClient2Legged } from "./client-2-legged";

const PROPS = {
  baseUrl: "https://api.example.test",
  clientId: "cid",
  clientSecret: "secret",
};

function authenticatedClient() {
  const client = new RCDEClient2Legged({ ...PROPS });
  // authenticate 経由でトークンを設定
  ext.postExtV2AuthToken.mockResolvedValue({
    data: { accessToken: "at", refreshToken: "rt", expiresAt: 123 },
  });
  return client;
}

beforeEach(() => {
  for (const fn of Object.values(ext)) fn.mockReset();
});

describe("RCDEClient2Legged: 認証ガード", () => {
  it("認証前に API メソッドを呼ぶと 'Token is not available' を throw する", async () => {
    const client = new RCDEClient2Legged({ ...PROPS });
    await expect(client.getConstructionList()).rejects.toThrow(
      "Token is not available"
    );
  });

  it("authenticate がレスポンスの data をトークンとして格納する", async () => {
    const client = new RCDEClient2Legged({ ...PROPS });
    ext.postExtV2AuthToken.mockResolvedValue({
      data: { accessToken: "at", refreshToken: "rt", expiresAt: 123 },
    });
    ext.postExtV2AuthenticatedConstruction.mockResolvedValue({ data: {} });

    await client.authenticate();
    // 認証後はガードを通過する（throw しない）
    await expect(
      client.createConstruction({
        period: new Date("2024-01-01T00:00:00.000Z"),
        contractedAt: new Date("2024-01-01T00:00:00.000Z"),
      } as never)
    ).resolves.toBeDefined();
  });
});

describe("RCDEClient2Legged: Date → ISO 文字列変換", () => {
  it("createConstruction は period / contractedAt を toISOString に変換して渡す", async () => {
    const client = authenticatedClient();
    await client.authenticate();
    ext.postExtV2AuthenticatedConstruction.mockResolvedValue({ data: { id: 1 } });

    const period = new Date("2025-03-01T12:00:00.000Z");
    const contractedAt = new Date("2025-04-15T08:30:00.000Z");
    await client.createConstruction({ name: "x", period, contractedAt } as never);

    const [payload] = ext.postExtV2AuthenticatedConstruction.mock.calls[0];
    expect(payload.period).toBe("2025-03-01T12:00:00.000Z");
    expect(payload.contractedAt).toBe("2025-04-15T08:30:00.000Z");
  });

  it("createContract は contractedAt を toISOString に変換して渡す", async () => {
    const client = authenticatedClient();
    await client.authenticate();
    ext.postExtV2AuthenticatedContract.mockResolvedValue({ data: { id: 2 } });

    const contractedAt = new Date("2025-06-30T23:59:59.000Z");
    await client.createContract({ name: "c", contractedAt } as never);

    const [payload] = ext.postExtV2AuthenticatedContract.mock.calls[0];
    expect(payload.contractedAt).toBe("2025-06-30T23:59:59.000Z");
  });
});

describe("RCDEClient2Legged.uploadContractFile: エラー分岐", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({} as Response));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("size を算出できない（0）場合は 'size field is required' を throw する", async () => {
    const client = authenticatedClient();
    await client.authenticate();

    await expect(
      // buffer は ArrayBuffer/Blob のいずれでもなく size 未指定 → 0
      client.uploadContractFile({
        contractId: 1,
        buffer: undefined as never,
      } as never)
    ).rejects.toThrow("size field is required");
  });

  it("presignedURL が欠落していると throw する", async () => {
    const client = authenticatedClient();
    await client.authenticate();
    ext.postExtV2AuthenticatedContractFilePointCloud.mockResolvedValue({
      data: { contractFileId: 10 }, // presignedURL なし
    });

    await expect(
      client.uploadContractFile({
        contractId: 1,
        buffer: new ArrayBuffer(8),
      } as never)
    ).rejects.toThrow("presignedURL が取得できませんでした");
  });

  it("contractFileId が欠落していると throw する", async () => {
    const client = authenticatedClient();
    await client.authenticate();
    ext.postExtV2AuthenticatedContractFilePointCloud.mockResolvedValue({
      data: { presignedURL: "https://s3.example/put" }, // contractFileId なし
    });

    await expect(
      client.uploadContractFile({
        contractId: 1,
        buffer: new ArrayBuffer(8),
      } as never)
    ).rejects.toThrow("contractFileId が取得できませんでした");
  });

  it("ArrayBuffer から size を算出し、完了レスポンスの data を返す", async () => {
    const client = authenticatedClient();
    await client.authenticate();
    ext.postExtV2AuthenticatedContractFilePointCloud.mockResolvedValue({
      data: { presignedURL: "https://s3.example/put", contractFileId: 10 },
    });
    ext.putExtV2AuthenticatedContractFileUploaded.mockResolvedValue({
      data: { ok: true },
    });

    const buffer = new ArrayBuffer(8);
    const result = await client.uploadContractFile({ contractId: 1, buffer } as never);

    // buffer.byteLength から size=8 を算出して URL 生成に渡す（SDK の計算ロジック）
    const [createPayload] =
      ext.postExtV2AuthenticatedContractFilePointCloud.mock.calls[0];
    expect(createPayload.size).toBe(8);

    // アップロード完了レスポンスを戻り値として返す
    expect(result).toEqual({ ok: true });
  });
});
