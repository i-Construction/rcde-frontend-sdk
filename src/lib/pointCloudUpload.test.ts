import { describe, expect, it, vi } from "vitest";
import {
  buildCompleteApiFetchInit,
  buildPointCloudUploadRequest,
  buildPresignedFileUpload,
  buildS3PartsFromUploadResults,
  buildStartApiFetchInit,
  buildUploadCompleteRequest,
  calculatePartTotal,
  DEFAULT_CHUNK_SIZE_BYTES,
  getBufferChunk,
  uploadPointCloudFile,
  uploadPointCloudFileMultipart,
  validateMultipartUploadStartResponse,
} from "./pointCloudUpload";

const baseUrl = "https://example.com";
const contractFileId = 777;
const presignedURL = "https://storage.example.com/upload/abc123";
const s3UploadId = "s3-upload-id-abc";
const blockChainUploadId = "bc-upload-id-xyz";
const MB = 1024 * 1024;

/** URL ごとに返すレスポンスの定義（ok=false にすると失敗を再現できる） */
type StubResponse = {
  ok?: boolean;
  status?: number;
  json?: unknown;
  etag?: string;
};

function createFetchMock(rules: { match: string; response: StubResponse }[]) {
  const fetchImpl = (async (input: unknown) => {
    const url = String(input);
    const rule = rules.find((r) => url.includes(r.match));
    const res = rule?.response ?? {};
    return {
      ok: res.ok ?? true,
      status: res.status ?? 200,
      json: async () => res.json ?? {},
      headers: {
        get: (name: string) => (name.toLowerCase() === "etag" ? (res.etag ?? null) : null),
      },
    } as Response;
  }) as typeof fetch;

  return { fetchImpl };
}

function createMultipartStartResponse(partTotal: number) {
  return {
    contractFileId,
    s3UploadId,
    blockChainUploadId,
    presignedUploadParts: Array.from({ length: partTotal }, (_, i) => ({
      partNumber: i + 1,
      presignedURL: `https://storage.example.com/part/${i + 1}`,
    })),
    blockChainUploadURLs: Array.from(
      { length: partTotal },
      (_, i) => `https://blockchain.example.com/part/${i + 1}`
    ),
  };
}

const defaultDeps = (fetchImpl: typeof fetch) => ({
  getApiPath: (segment: string) => `${baseUrl}/ext/v2/authenticated${segment}`,
  fetchImpl,
  getAuthHeaders: () => ({ "Content-Type": "application/json" }),
});

describe("点群ファイルのアップロード開始（サーバーへサイズ等を伝える）", () => {
  describe("正常系", () => {
    it("1024 バイトの点群ファイルをアップロード開始するとき、サーバーへ送る size は 1024 になる", () => {
      const request = buildPointCloudUploadRequest({
        contractId: 1,
        name: "big.las",
        buffer: new ArrayBuffer(1024),
      });

      expect(request.size).toBe(1024);
    });

    it("点群属性を指定しないとき、開始 API へ送る pointCloudAttribute は空オブジェクトになる", () => {
      const request = buildPointCloudUploadRequest({
        contractId: 1,
        name: "a.las",
        buffer: new ArrayBuffer(4),
      });

      expect(request.pointCloudAttribute).toEqual({});
    });

    it("点群属性（座標系など）を指定したとき、開始 API へその内容をそのまま送る", () => {
      const attribute = { srid: 6677 };
      const request = buildPointCloudUploadRequest({
        contractId: 1,
        name: "b.las",
        buffer: new ArrayBuffer(4),
        pointCloudAttribute: attribute,
      });

      expect(request.pointCloudAttribute).toEqual(attribute);
    });

    it("開始 API へ送るリクエストは POST で JSON 化される", () => {
      const request = buildPointCloudUploadRequest({
        contractId: 1,
        name: "sample.las",
        buffer: new ArrayBuffer(4),
      });
      const headers = { "Content-Type": "application/json", Authorization: "Bearer token" };
      const init = buildStartApiFetchInit(request, headers);

      expect(init.method).toBe("POST");
      expect(init.headers).toBe(headers);
      expect(JSON.parse(init.body)).toEqual(request);
    });
  });
});

describe("点群ファイル本体の presigned URL 送信", () => {
  describe("正常系", () => {
    it("点群ファイル本体を presigned URL へ送るとき、PUT で渡したファイルをそのまま送る", () => {
      const buffer = new ArrayBuffer(1024);
      const upload = buildPresignedFileUpload(buffer);

      expect(upload.method).toBe("PUT");
      expect(upload.body).toBe(buffer);
    });
  });
});

describe("点群ファイルの本体送信後（サーバーへ完了を伝える）", () => {
  it("完了通知 API へ、どの契約のファイルかを示す contractId を送る", () => {
    expect(buildUploadCompleteRequest(42)).toEqual({ contractId: 42 });
  });

  it("完了通知 API へ送るリクエストは PUT で contractId を JSON 化する", () => {
    const headers = { "Content-Type": "application/json" };
    const init = buildCompleteApiFetchInit(42, headers);

    expect(init.method).toBe("PUT");
    expect(init.headers).toBe(headers);
    expect(JSON.parse(init.body)).toEqual({ contractId: 42 });
  });
});

describe("点群ファイルのアップロード手順（3 段階の実行）", () => {
  describe("正常系", () => {
    it("点群ファイルのアップロードがすべて成功したとき、完了通知 API のレスポンスを返す", async () => {
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud",
          response: { json: { presignedURL, contractFileId } },
        },
        { match: presignedURL, response: {} },
        {
          match: `/contractFile/uploaded/${contractFileId}`,
          response: { json: { contractFileId, status: "uploaded" } },
        },
      ]);

      const result = await uploadPointCloudFile(defaultDeps(fetchImpl), {
        contractId: 1,
        name: "sample.las",
        buffer: new ArrayBuffer(4),
      });

      expect(result).toEqual({ contractFileId, status: "uploaded" });
    });

    it("アップロード開始 API が contractFileId を返したとき、onContractFileCreated がその ID で 1 回呼ばれる", async () => {
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud",
          response: { json: { presignedURL, contractFileId } },
        },
        { match: presignedURL, response: {} },
        {
          match: `/contractFile/uploaded/${contractFileId}`,
          response: { json: { contractFileId, status: "uploaded" } },
        },
      ]);
      const onContractFileCreated = vi.fn();

      await uploadPointCloudFile(defaultDeps(fetchImpl), {
        contractId: 1,
        name: "sample.las",
        buffer: new ArrayBuffer(4),
        onContractFileCreated,
      });

      expect(onContractFileCreated).toHaveBeenCalledOnce();
      expect(onContractFileCreated).toHaveBeenCalledWith(contractFileId);
    });
  });

  describe("異常系", () => {
    it("開始 API（サイズ登録）がエラーのとき、HTTP 400 で失敗する", async () => {
      const { fetchImpl } = createFetchMock([
        { match: "/contractFile/pointCloud", response: { ok: false, status: 400 } },
      ]);

      await expect(
        uploadPointCloudFile(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(4),
        })
      ).rejects.toThrow("HTTP 400");
    });

    it("presigned URL への本体送信がエラーのとき、Upload failed で失敗する", async () => {
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud",
          response: { json: { presignedURL, contractFileId } },
        },
        { match: presignedURL, response: { ok: false, status: 403 } },
      ]);

      await expect(
        uploadPointCloudFile(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(4),
        })
      ).rejects.toThrow("Upload failed: HTTP 403");
    });

    it("完了通知 API がエラーのとき、Complete upload failed で失敗する", async () => {
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud",
          response: { json: { presignedURL, contractFileId } },
        },
        { match: presignedURL, response: {} },
        {
          match: `/contractFile/uploaded/${contractFileId}`,
          response: { ok: false, status: 500 },
        },
      ]);

      await expect(
        uploadPointCloudFile(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(4),
        })
      ).rejects.toThrow("Complete upload failed: HTTP 500");
    });
  });
});

describe("点群ファイルのチャンク分割（partTotal とバッファ境界）", () => {
  describe("正常系", () => {
    it("100MB ちょうどのファイルを 100MB チャンクで分割するとき、partTotal は 1 になる", () => {
      expect(calculatePartTotal(100 * MB, DEFAULT_CHUNK_SIZE_BYTES)).toBe(1);
    });

    it("250MB のファイルを 100MB チャンクで分割するとき、partTotal は 3 になる", () => {
      expect(calculatePartTotal(250 * MB, DEFAULT_CHUNK_SIZE_BYTES)).toBe(3);
    });

    it("250MB のファイルを 3 パートに分割したとき、各チャンクのバイト長は 100MB・100MB・50MB になる", () => {
      const buffer = new ArrayBuffer(250 * MB);
      expect(getBufferChunk(buffer, 0, 100 * MB).byteLength).toBe(100 * MB);
      expect(getBufferChunk(buffer, 1, 100 * MB).byteLength).toBe(100 * MB);
      expect(getBufferChunk(buffer, 2, 100 * MB).byteLength).toBe(50 * MB);
    });

    it("S3 パートアップロード結果から s3Parts 配列を組み立てる", () => {
      const results = [
        { partNumber: 1, etag: '"etag-part-1"' },
        { partNumber: 2, etag: '"etag-part-2"' },
      ];

      expect(buildS3PartsFromUploadResults(results)).toEqual([
        { partNumber: 1, etag: '"etag-part-1"' },
        { partNumber: 2, etag: '"etag-part-2"' },
      ]);
    });

    it("presignedUploadParts と blockChainUploadURLs の件数が一致しないとき、Invalid multipart upload start response で失敗する", () => {
      expect(() =>
        validateMultipartUploadStartResponse(
          [{ partNumber: 1, presignedURL: "https://storage.example.com/part/1" }],
          []
        )
      ).toThrow("Invalid multipart upload start response");
    });
  });
});

describe("点群ファイルのチャンク分割アップロード手順（multipart 実行）", () => {
  describe("正常系", () => {
    it("チャンク分割アップロードがすべて成功したとき、contractFileId を返す", async () => {
      const partTotal = 2;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        { match: "storage.example.com/part", response: { etag: '"etag-1"' } },
        { match: "blockchain.example.com/part", response: {} },
        {
          match: "/contractFile/pointCloud/completeMultipartUpload",
          response: {},
        },
      ]);

      const result = await uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
        contractId: 1,
        name: "big.las",
        buffer: new ArrayBuffer(150 * MB),
        chunkSize: 100 * MB,
      });

      expect(result).toEqual({ contractFileId });
    });

    it("multipart 開始 API が contractFileId を返したとき、onContractFileCreated がその ID で 1 回呼ばれる", async () => {
      const partTotal = 1;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        { match: "storage.example.com/part", response: { etag: '"etag-1"' } },
        { match: "blockchain.example.com/part", response: {} },
        {
          match: "/contractFile/pointCloud/completeMultipartUpload",
          response: {},
        },
      ]);
      const onContractFileCreated = vi.fn();

      await uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
        contractId: 1,
        name: "sample.las",
        buffer: new ArrayBuffer(50 * MB),
        chunkSize: 100 * MB,
        onContractFileCreated,
      });

      expect(onContractFileCreated).toHaveBeenCalledOnce();
      expect(onContractFileCreated).toHaveBeenCalledWith(contractFileId);
    });

    it("2 パートのアップロード中、onUploadProgress が 1/2 → 2/2 の順で進捗を通知する", async () => {
      const partTotal = 2;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        { match: "storage.example.com/part", response: { etag: '"etag-1"' } },
        { match: "blockchain.example.com/part", response: {} },
        {
          match: "/contractFile/pointCloud/completeMultipartUpload",
          response: {},
        },
      ]);
      const progressCalls: [number, number][] = [];
      const onUploadProgress = (completed: number, total: number) => {
        progressCalls.push([completed, total]);
      };

      await uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
        contractId: 1,
        name: "big.las",
        buffer: new ArrayBuffer(150 * MB),
        chunkSize: 100 * MB,
        onUploadProgress,
      });

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls).toContainEqual([1, 2]);
      expect(progressCalls).toContainEqual([2, 2]);
    });
  });

  describe("異常系", () => {
    it("multipart 開始 API がエラーのとき、HTTP 400 で失敗する", async () => {
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { ok: false, status: 400 },
        },
      ]);

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(150 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("HTTP 400");
    });

    it("開始 API の presignedUploadParts と blockChainUploadURLs の件数が一致しないとき、Invalid multipart upload start response で失敗する", async () => {
      const startResponse = {
        ...createMultipartStartResponse(2),
        blockChainUploadURLs: ["https://blockchain.example.com/part/1"],
      };
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
      ]);

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(150 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("Invalid multipart upload start response");
    });

    it("S3 パート PUT のレスポンスに ETag が無いとき、missing ETag で失敗する", async () => {
      const partTotal = 1;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        { match: "storage.example.com/part", response: {} },
        {
          match: "/contractFile/pointCloud/deleteMultipartUpload",
          response: {},
        },
      ]);

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(50 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("Upload failed: missing ETag in S3 response");
    });

    it("S3 パート PUT がエラーのとき、Upload failed で失敗する", async () => {
      const partTotal = 1;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        {
          match: "storage.example.com/part/1",
          response: { ok: false, status: 403 },
        },
        {
          match: "/contractFile/pointCloud/deleteMultipartUpload",
          response: {},
        },
      ]);

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(50 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("Upload failed: HTTP 403");
    });

    it("S3 パート PUT 失敗時、deleteMultipartUpload が呼ばれる", async () => {
      const partTotal = 1;
      const startResponse = createMultipartStartResponse(partTotal);
      let deleteCalled = false;
      const fetchImpl = (async (input: unknown) => {
        const url = String(input);
        if (url.includes("/contractFile/pointCloud/multipartUpload")) {
          return {
            ok: true,
            status: 200,
            json: async () => startResponse,
            headers: { get: () => null },
          } as unknown as Response;
        }
        if (url.includes("storage.example.com/part/1")) {
          return {
            ok: false,
            status: 403,
            json: async () => ({}),
            headers: { get: () => null },
          } as unknown as Response;
        }
        if (url.includes("/contractFile/pointCloud/deleteMultipartUpload")) {
          deleteCalled = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({}),
            headers: { get: () => null },
          } as unknown as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
          headers: { get: () => null },
        } as unknown as Response;
      }) as typeof fetch;

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(50 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("Upload failed: HTTP 403");

      expect(deleteCalled).toBe(true);
    });

    it("完了 API がエラーのとき、Complete multipart upload failed で失敗する", async () => {
      const partTotal = 1;
      const startResponse = createMultipartStartResponse(partTotal);
      const { fetchImpl } = createFetchMock([
        {
          match: "/contractFile/pointCloud/multipartUpload",
          response: { json: startResponse },
        },
        { match: "storage.example.com/part", response: { etag: '"etag-1"' } },
        { match: "blockchain.example.com/part", response: {} },
        {
          match: "/contractFile/pointCloud/completeMultipartUpload",
          response: { ok: false, status: 500 },
        },
        {
          match: "/contractFile/pointCloud/deleteMultipartUpload",
          response: {},
        },
      ]);

      await expect(
        uploadPointCloudFileMultipart(defaultDeps(fetchImpl), {
          contractId: 1,
          name: "sample.las",
          buffer: new ArrayBuffer(50 * MB),
          chunkSize: 100 * MB,
        })
      ).rejects.toThrow("Complete multipart upload failed: HTTP 500");
    });
  });
});
