import { describe, expect, it, vi } from "vitest";
import {
  buildCompleteApiFetchInit,
  buildPointCloudUploadRequest,
  buildPresignedFileUpload,
  buildStartApiFetchInit,
  buildUploadCompleteRequest,
  uploadPointCloudFile,
} from "./pointCloudUpload";

const baseUrl = "https://example.com";
const contractFileId = 777;
const presignedURL = "https://storage.example.com/upload/abc123";

/** URL ごとに返すレスポンスの定義（ok=false にすると失敗を再現できる） */
type StubResponse = {
  ok?: boolean;
  status?: number;
  json?: unknown;
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
    } as Response;
  }) as typeof fetch;

  return { fetchImpl };
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
