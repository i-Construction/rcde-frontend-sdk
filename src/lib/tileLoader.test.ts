import { describe, expect, it, vi } from "vitest";
import { loadTile, type TileLoadResult } from "./tileLoader";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeParsedPng(buffer: ArrayBuffer) {
  const data = new Uint8Array(buffer);
  return { data, width: 1, height: data.byteLength / 4 };
}

const mockParsePng = async (buffer: ArrayBuffer) => makeParsedPng(buffer);

// ---------------------------------------------------------------------------
// 1: Position のみ取得（color なし）
// ---------------------------------------------------------------------------
describe("loadTile（Position のみ）", () => {
  it("Position バッファを取得・パースして返す", async () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const fetchPosition = vi.fn(async () => buffer);

    const result = await loadTile(fetchPosition, undefined, mockParsePng);

    expect(fetchPosition).toHaveBeenCalledTimes(1);
    expect(result.position.data).toEqual(new Uint8Array([1, 2, 3, 4]));
    expect(result.color).toBeUndefined();
    expect(result.compressedBytes).toBe(4);
    expect(result.decodedBytes).toBe(4);
  });

  it("Position が undefined のとき例外を投げる", async () => {
    const fetchPosition = vi.fn(async () => undefined);

    await expect(loadTile(fetchPosition, undefined, mockParsePng)).rejects.toThrow(
      "Failed to load PNG buffer"
    );
  });
});

// ---------------------------------------------------------------------------
// 2: Position + Color 並列取得
// ---------------------------------------------------------------------------
describe("loadTile（Position + Color 並列）", () => {
  it("Position と Color の両方を取得・パースして返す", async () => {
    const pBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const cBuffer = new Uint8Array([5, 6, 7, 8]).buffer;
    const fetchPosition = vi.fn(async () => pBuffer);
    const fetchColor = vi.fn(async () => cBuffer);

    const result = await loadTile(fetchPosition, fetchColor, mockParsePng);

    expect(fetchPosition).toHaveBeenCalledTimes(1);
    expect(fetchColor).toHaveBeenCalledTimes(1);
    expect(result.position.data).toEqual(new Uint8Array([1, 2, 3, 4]));
    // Position のみのケース（color は undefined）との対比なので、まず存在すること自体を主張する
    expect(result.color).toBeDefined();
    expect(result.color?.data).toEqual(new Uint8Array([5, 6, 7, 8]));
    expect(result.compressedBytes).toBe(8);
    expect(result.decodedBytes).toBe(8);
  });

  it("Position と Color を並列にフェッチする（直列ではない）", async () => {
    const callOrder: string[] = [];

    const fetchPosition = async () => {
      callOrder.push("pos-start");
      await delay(30);
      callOrder.push("pos-end");
      return new ArrayBuffer(4);
    };
    const fetchColor = async () => {
      callOrder.push("color-start");
      await delay(30);
      callOrder.push("color-end");
      return new ArrayBuffer(4);
    };

    await loadTile(fetchPosition, fetchColor, mockParsePng);

    // 並列: 両方の start が両方の end よりも前に来る
    expect(callOrder.indexOf("pos-start")).toBeLessThan(callOrder.indexOf("pos-end"));
    expect(callOrder.indexOf("color-start")).toBeLessThan(callOrder.indexOf("color-end"));
    expect(callOrder.indexOf("pos-start")).toBeLessThan(callOrder.indexOf("color-end"));
    expect(callOrder.indexOf("color-start")).toBeLessThan(callOrder.indexOf("pos-end"));
  });

  it("PNG パースも並列に実行する", async () => {
    const callOrder: string[] = [];
    const pBuffer = new ArrayBuffer(4);
    const cBuffer = new ArrayBuffer(4);

    const slowParsePng = async (buffer: ArrayBuffer) => {
      const label = buffer === pBuffer ? "parse-pos" : "parse-color";
      callOrder.push(`${label}-start`);
      await delay(30);
      callOrder.push(`${label}-end`);
      return makeParsedPng(buffer);
    };

    await loadTile(
      async () => pBuffer,
      async () => cBuffer,
      slowParsePng
    );

    expect(callOrder.indexOf("parse-pos-start")).toBeLessThan(callOrder.indexOf("parse-color-end"));
    expect(callOrder.indexOf("parse-color-start")).toBeLessThan(callOrder.indexOf("parse-pos-end"));
  });

  it("Position が undefined のとき例外を投げる", async () => {
    await expect(
      loadTile(
        async () => undefined,
        async () => new ArrayBuffer(4),
        mockParsePng
      )
    ).rejects.toThrow("Failed to load PNG buffer");
  });

  it("Color が undefined のとき例外を投げる", async () => {
    await expect(
      loadTile(
        async () => new ArrayBuffer(4),
        async () => undefined,
        mockParsePng
      )
    ).rejects.toThrow("Failed to load PNG buffer");
  });

  it("fetchPosition が reject すると例外が伝播する", async () => {
    await expect(
      loadTile(
        async () => {
          throw new Error("network error");
        },
        async () => new ArrayBuffer(4),
        mockParsePng
      )
    ).rejects.toThrow("network error");
  });

  it("parsePng が reject すると例外が伝播する", async () => {
    const failParse = async () => {
      throw new Error("corrupt PNG");
    };

    await expect(
      loadTile(
        async () => new ArrayBuffer(4),
        async () => new ArrayBuffer(4),
        failParse
      )
    ).rejects.toThrow("corrupt PNG");
  });
});

// ---------------------------------------------------------------------------
// 3: バイトサイズ計算
// ---------------------------------------------------------------------------
describe("loadTile（バイトサイズ計算）", () => {
  it("compressedBytes は元バッファのサイズ合計", async () => {
    const pBuffer = new ArrayBuffer(100);
    const cBuffer = new ArrayBuffer(200);

    const result = await loadTile(
      async () => pBuffer,
      async () => cBuffer,
      mockParsePng
    );

    expect(result.compressedBytes).toBe(300);
  });

  it("decodedBytes はパース後データのサイズ合計", async () => {
    const expandingParse = async (buffer: ArrayBuffer) => {
      const expanded = new Uint8Array(buffer.byteLength * 4);
      return { data: expanded, width: 1, height: expanded.byteLength / 4 };
    };

    const result: TileLoadResult = await loadTile(
      async () => new ArrayBuffer(10),
      async () => new ArrayBuffer(20),
      expandingParse
    );

    expect(result.decodedBytes).toBe(10 * 4 + 20 * 4);
  });
});
