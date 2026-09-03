import { describe, expect, it } from "vitest";
import { RCDEClient } from "./rcde-client";

const constructionId = 1;
const contractId = 1;

/**
 * ID の検証だけを確かめるテストなので、一覧の要素は unknown にしておく。
 * R-CDE が型どおりでない値を返した場合を組み立てられるようにするため。
 */
type RawListPayload = Record<string, unknown[]>;

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

/** ID だけを差し替えた契約ファイル 1 件の一覧を取得し、その 1 件を返す */
async function fetchFirstContractFileWithId(rawId: unknown) {
  const client = createClient({
    contractFiles: [{ id: rawId, name: "sample.las", uploadedAt: "2024-11-19T06:56:31Z" }],
  });
  const { contractFiles } = await client.getContractFileList({ contractId });
  return contractFiles[0];
}

/** ID だけを差し替えた契約 1 件の一覧を取得し、その 1 件を返す */
async function fetchFirstContractWithId(rawId: unknown) {
  const client = createClient({ contracts: [{ id: rawId, name: "第 1 期工事" }] });
  const { contracts } = await client.getContractList({ constructionId });
  return contracts[0];
}

/** ID だけを差し替えた現場 1 件の一覧を取得し、その 1 件を返す */
async function fetchFirstConstructionWithId(rawId: unknown) {
  const client = createClient({ constructions: [{ id: rawId, name: "○○川改修工事" }] });
  const { constructions } = await client.getConstructionList();
  return constructions[0];
}

describe("契約ファイル一覧の ID 取り込み（getContractFileList）", () => {
  describe("正常系", () => {
    it("R-CDE が ID に整数を返したとき、その数値をそのまま利用側へ渡す", async () => {
      const contractFile = await fetchFirstContractFileWithId(10);

      expect(contractFile.id).toBe(10);
    });

    it("ID が 0 のファイルは、偽値として捨てず 0 のまま利用側へ渡す", async () => {
      const contractFile = await fetchFirstContractFileWithId(0);

      expect(contractFile.id).toBe(0);
    });

    it("ID が負の整数のファイルも、整数として読める限りそのまま利用側へ渡す", async () => {
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

    it("ID が小数で届いたとき、String() で 1.5 のまま URL に載るため ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(1.5);

      expect(contractFile.id).toBeUndefined();
    });

    it("ID が 1e21 で届いたとき、String() が指数表記になるため ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(1e21);

      expect(contractFile.id).toBeUndefined();
    });

    it("ID が安全な整数の範囲を超えた値で届いたとき、別の整数と混同しないよう ID 無しとして扱う", async () => {
      const contractFile = await fetchFirstContractFileWithId(Number.MAX_SAFE_INTEGER + 2);

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

describe("契約一覧の ID 取り込み（getContractList）", () => {
  describe("正常系", () => {
    it("R-CDE が ID に整数を返したとき、その数値をそのまま利用側へ渡す", async () => {
      const contract = await fetchFirstContractWithId(7);

      expect(contract.id).toBe(7);
    });
  });

  describe("異常系", () => {
    it("ID が数値ではなく文字列で届いたとき、文字列を素通しせず ID 無しとして扱う", async () => {
      const contract = await fetchFirstContractWithId("7");

      expect(contract.id).toBeUndefined();
    });

    it("ID が NaN で届いたとき、数値の一種として通さず ID 無しとして扱う", async () => {
      const contract = await fetchFirstContractWithId(Number.NaN);

      expect(contract.id).toBeUndefined();
    });

    it("ID が小数で届いたとき、String() で 1.5 のまま URL に載るため ID 無しとして扱う", async () => {
      const contract = await fetchFirstContractWithId(1.5);

      expect(contract.id).toBeUndefined();
    });

    it("ID が 1e21 で届いたとき、String() が指数表記になるため ID 無しとして扱う", async () => {
      const contract = await fetchFirstContractWithId(1e21);

      expect(contract.id).toBeUndefined();
    });

    it("ID を読めない契約があっても、名前は読めるまま一覧に残す", async () => {
      const contract = await fetchFirstContractWithId("7");

      expect(contract).toEqual({ id: undefined, name: "第 1 期工事" });
    });

    it("ID を読めない契約が混ざっていても、一覧の件数は減らさず他の契約もそのまま残す", async () => {
      const client = createClient({
        contracts: [
          { id: 7, name: "第 1 期工事" },
          { id: "broken", name: "第 2 期工事" },
          { id: 9, name: "第 3 期工事" },
        ],
      });

      const { contracts } = await client.getContractList({ constructionId });

      expect(contracts.map((contract) => contract.id)).toEqual([7, undefined, 9]);
      expect(contracts).toHaveLength(3);
    });
  });
});

describe("現場一覧の ID 取り込み（getConstructionList）", () => {
  describe("正常系", () => {
    it("R-CDE が ID に整数を返したとき、その数値をそのまま利用側へ渡す", async () => {
      const construction = await fetchFirstConstructionWithId(3);

      expect(construction.id).toBe(3);
    });
  });

  describe("異常系", () => {
    it("ID が数値ではなく文字列で届いたとき、文字列を素通しせず ID 無しとして扱う", async () => {
      const construction = await fetchFirstConstructionWithId("3");

      expect(construction.id).toBeUndefined();
    });

    it("ID が NaN で届いたとき、数値の一種として通さず ID 無しとして扱う", async () => {
      const construction = await fetchFirstConstructionWithId(Number.NaN);

      expect(construction.id).toBeUndefined();
    });

    it("ID が小数で届いたとき、String() で 1.5 のまま URL に載るため ID 無しとして扱う", async () => {
      const construction = await fetchFirstConstructionWithId(1.5);

      expect(construction.id).toBeUndefined();
    });

    it("ID が 1e21 で届いたとき、String() が指数表記になるため ID 無しとして扱う", async () => {
      const construction = await fetchFirstConstructionWithId(1e21);

      expect(construction.id).toBeUndefined();
    });

    it("ID を読めない現場があっても、名前は読めるまま一覧に残す", async () => {
      const construction = await fetchFirstConstructionWithId("3");

      expect(construction).toEqual({ id: undefined, name: "○○川改修工事" });
    });

    it("ID を読めない現場が混ざっていても、一覧の件数は減らさず他の現場もそのまま残す", async () => {
      const client = createClient({
        constructions: [
          { id: 3, name: "○○川改修工事" },
          { id: "broken", name: "△△線道路工事" },
          { id: 5, name: "□□橋補修工事" },
        ],
      });

      const { constructions } = await client.getConstructionList();

      expect(constructions.map((construction) => construction.id)).toEqual([3, undefined, 5]);
      expect(constructions).toHaveLength(3);
    });
  });
});
