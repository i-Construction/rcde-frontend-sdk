import { describe, expect, it } from "vitest";
import { RCDEClient } from "./rcde-client";

const contractId = 1;

/**
 * 契約ファイル一覧の生 JSON。ID の検証を確かめるテストなので、
 * R-CDE が何を返しても組み立てられるよう contractFiles の要素は unknown にしておく。
 */
type RawListPayload = { contractFiles: unknown[] };

/** 決まった一覧レスポンスだけを返すクライアント */
function createClient(payload: RawListPayload) {
  const fetchImpl = (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as Response) as unknown as typeof fetch;

  return new RCDEClient({ baseUrl: "https://example.com", fetchImpl });
}

/** ID だけを差し替えた 1 件の一覧を取得し、その 1 件を返す */
async function fetchFirstContractFileWithId(rawId: unknown) {
  const client = createClient({
    contractFiles: [{ id: rawId, name: "sample.las", uploadedAt: "2024-11-19T06:56:31Z" }],
  });
  const { contractFiles } = await client.getContractFileList({ contractId });
  return contractFiles[0];
}

describe("契約ファイル一覧の ID 取り込み（getContractFileList）", () => {
  describe("正常系", () => {
    it("R-CDE が ID に数値を返したとき、その数値をそのまま利用側へ渡す", async () => {
      const contractFile = await fetchFirstContractFileWithId(10);

      expect(contractFile.id).toBe(10);
    });

    it("ID が 0 のファイルは、偽値として捨てず 0 のまま利用側へ渡す", async () => {
      const contractFile = await fetchFirstContractFileWithId(0);

      expect(contractFile.id).toBe(0);
    });

    it("ID が負の数のファイルも、数値として読める限りそのまま利用側へ渡す", async () => {
      const contractFile = await fetchFirstContractFileWithId(-1);

      expect(contractFile.id).toBe(-1);
    });
  });

  describe("異常系", () => {
    it("ID のキーが無いファイルが届いたとき、ID 無しとして扱う", async () => {
      const client = createClient({ contractFiles: [{ name: "sample.las" }] });

      const { contractFiles } = await client.getContractFileList({ contractId });

      expect(contractFiles[0].id).toBeUndefined();
    });

    it("ID が数値ではなく文字列で届いたとき、文字列を素通しせず ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId("10");

      expect(contractFile.id).toBeUndefined();
    });

    it("ID が NaN で届いたとき、数値の一種として通さず ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(Number.NaN);

      expect(contractFile.id).toBeUndefined();
    });

    it("ID が Infinity で届いたとき、数値の一種として通さず ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(Number.POSITIVE_INFINITY);

      expect(contractFile.id).toBeUndefined();
    });

    it("ID が null で届いたとき、ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(null);

      expect(contractFile.id).toBeUndefined();
    });

    it("ID を読めないファイルがあっても、名前と受領日時は読めるまま一覧に残す", async () => {
      const contractFile = await fetchFirstContractFileWithId("10");

      expect(contractFile).toEqual({
        id: undefined,
        name: "sample.las",
        status: undefined,
        uploadedAt: "2024-11-19T06:56:31Z",
        batchProcessingResult: undefined,
      });
    });

    it("ID を読めないファイルが混ざっていても、一覧の件数は減らさず他のファイルもそのまま残す", async () => {
      const client = createClient({
        contractFiles: [
          { id: 10, name: "first.las" },
          { id: "broken", name: "second.las" },
          { id: 12, name: "third.las" },
        ],
      });

      const { contractFiles } = await client.getContractFileList({ contractId });

      expect(contractFiles.map((file) => file.name)).toEqual([
        "first.las",
        "second.las",
        "third.las",
      ]);
      expect(contractFiles.map((file) => file.id)).toEqual([10, undefined, 12]);
    });
  });
});
