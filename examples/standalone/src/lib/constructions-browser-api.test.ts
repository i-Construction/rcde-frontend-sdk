import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeConstructionsApiError,
  fetchConstructions,
  fetchContracts,
} from "./constructions-browser-api";

const ACCESS_TOKEN = "access-token-abc";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function htmlResponse(status: number): Response {
  return new Response("<html><body>Bad Gateway</body></html>", {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

function stubFetch(respond: () => Promise<Response>) {
  const fetchStub = vi.fn(respond);
  vi.stubGlobal("fetch", fetchStub);
  return fetchStub;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchConstructions", () => {
  it("現場一覧 API が現場を返すとき、その現場の配列を返す", async () => {
    stubFetch(async () => jsonResponse({ constructions: [{ id: 1, name: "第一現場" }] }));

    const constructions = await fetchConstructions(ACCESS_TOKEN);

    expect(constructions).toEqual([{ id: 1, name: "第一現場" }]);
  });

  it("現場一覧 API の応答に constructions が含まれないとき、空配列を返す", async () => {
    stubFetch(async () => jsonResponse({}));

    const constructions = await fetchConstructions(ACCESS_TOKEN);

    expect(constructions).toEqual([]);
  });

  it("現場一覧を取得するとき、アクセストークンを Bearer としてサーバーへ送る", async () => {
    const fetchStub = stubFetch(async () => jsonResponse({ constructions: [] }));

    await fetchConstructions(ACCESS_TOKEN);

    expect(fetchStub).toHaveBeenCalledWith("/api/constructions", {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
  });

  it("現場一覧 API がエラーを返すとき、応答本文のエラーメッセージで失敗する", async () => {
    stubFetch(async () => jsonResponse({ error: "現場を取得する権限がありません" }, 403));

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toThrow(
      "現場を取得する権限がありません"
    );
  });

  it("現場一覧 API のエラー応答が JSON でないとき、既定の文言で失敗する", async () => {
    stubFetch(async () => htmlResponse(502));

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toThrow("現場一覧の取得に失敗しました");
  });

  it("現場一覧 API への通信自体が失敗したとき、既定の文言で失敗する", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toThrow("現場一覧の取得に失敗しました");
  });

  it("現場一覧 API への通信自体が失敗したとき、元の例外を cause として残す", async () => {
    const networkFailure = new TypeError("Failed to fetch");
    stubFetch(async () => {
      throw networkFailure;
    });

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toMatchObject({
      cause: networkFailure,
    });
  });

  it("現場一覧 API が constructions に配列以外を返すとき、既定の文言で失敗する", async () => {
    stubFetch(async () => jsonResponse({ constructions: { id: 1, name: "第一現場" } }));

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toThrow("現場一覧の取得に失敗しました");
  });

  it("現場一覧 API が JSON のオブジェクト以外を返すとき、既定の文言で失敗する", async () => {
    stubFetch(async () => jsonResponse("現場一覧"));

    await expect(fetchConstructions(ACCESS_TOKEN)).rejects.toThrow("現場一覧の取得に失敗しました");
  });
});

describe("fetchContracts", () => {
  it("契約一覧 API が契約を返すとき、その契約の配列を返す", async () => {
    stubFetch(async () => jsonResponse({ contracts: [{ id: 10, name: "第一契約" }] }));

    const contracts = await fetchContracts(ACCESS_TOKEN, 42);

    expect(contracts).toEqual([{ id: 10, name: "第一契約" }]);
  });

  it("契約一覧を取得するとき、指定した現場 ID をクエリに付けてサーバーへ送る", async () => {
    const fetchStub = stubFetch(async () => jsonResponse({ contracts: [] }));

    await fetchContracts(ACCESS_TOKEN, 42);

    expect(fetchStub).toHaveBeenCalledWith("/api/constructions?constructionId=42", {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
  });

  it("契約一覧 API がエラーを返すとき、空配列ではなくエラーとして失敗する", async () => {
    stubFetch(async () => jsonResponse({ error: "契約が見つかりません" }, 404));

    await expect(fetchContracts(ACCESS_TOKEN, 42)).rejects.toThrow("契約が見つかりません");
  });

  it("契約一覧 API のエラー応答が JSON でないとき、既定の文言で失敗する", async () => {
    stubFetch(async () => htmlResponse(500));

    await expect(fetchContracts(ACCESS_TOKEN, 42)).rejects.toThrow("契約一覧の取得に失敗しました");
  });

  it("契約一覧 API が contracts に配列以外を返すとき、既定の文言で失敗する", async () => {
    stubFetch(async () => jsonResponse({ contracts: "第一契約" }));

    await expect(fetchContracts(ACCESS_TOKEN, 42)).rejects.toThrow("契約一覧の取得に失敗しました");
  });
});

describe("describeConstructionsApiError", () => {
  it("Error が渡されたとき、そのメッセージをそのまま返す", () => {
    const message = describeConstructionsApiError(new Error("現場一覧の取得に失敗しました"));

    expect(message).toBe("現場一覧の取得に失敗しました");
  });

  it("Error 以外が渡されたとき、既定の文言を返す", () => {
    const message = describeConstructionsApiError("想定外の値");

    expect(message).toBe("データの取得に失敗しました");
  });
});
