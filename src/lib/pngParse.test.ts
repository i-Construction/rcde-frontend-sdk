import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock のファクトリはファイル先頭にホイストされるため、
// モッククラスをファクトリ内に定義する必要がある。
// テストから挙動を切り替えるために globalThis 経由でフラグを渡す。
declare global {
  // eslint-disable-next-line no-var
  var __pngMockNextError: Error | null;
}

vi.mock("pngjs/browser", () => {
  type Handler = (...args: unknown[]) => void;

  class MockPNG {
    private handlers: Record<string, Handler[]> = {};
    public data: Uint8Array = new Uint8Array();
    public width = 0;
    public height = 0;
    private _buffer: ArrayBuffer | null = null;
    private _shouldError: Error | null = null;

    constructor() {
      this._shouldError = globalThis.__pngMockNextError ?? null;
      globalThis.__pngMockNextError = null;
    }

    parse(buffer: ArrayBuffer) {
      this._buffer = buffer;
      Promise.resolve().then(() => {
        if (this._shouldError) {
          this.emit("error", this._shouldError);
        } else {
          this.data = new Uint8Array(this._buffer!);
          this.width = 2;
          this.height = Math.max(1, this.data.length / (4 * 2));
          this.emit("parsed");
        }
      });
      return this;
    }

    on(event: string, handler: Handler) {
      if (!this.handlers[event]) this.handlers[event] = [];
      this.handlers[event].push(handler);
      return this;
    }

    private emit(event: string, ...args: unknown[]) {
      for (const handler of this.handlers[event] || []) {
        handler(...args);
      }
    }
  }

  return { PNG: MockPNG };
});

import { parsePngBuffer } from "./pngParse";

beforeEach(() => {
  globalThis.__pngMockNextError = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parsePngBuffer", () => {
  it("正常な ArrayBuffer を渡すと解析結果で resolve する", async () => {
    const buffer = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]).buffer;

    const result = await parsePngBuffer(buffer);

    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data).toEqual(new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]));
    expect(result.width).toBe(2);
  });

  it("PNG パースエラー時に reject する", async () => {
    globalThis.__pngMockNextError = new Error("Invalid PNG signature");

    const buffer = new ArrayBuffer(8);

    await expect(parsePngBuffer(buffer)).rejects.toThrow("Invalid PNG signature");
  });

  it("空の ArrayBuffer でも正常に処理できる", async () => {
    const buffer = new ArrayBuffer(0);

    const result = await parsePngBuffer(buffer);

    expect(result.data).toEqual(new Uint8Array([]));
  });

  it("複数のバッファを並列にパースできる", async () => {
    const buf1 = new Uint8Array([1, 2, 3, 4]).buffer;
    const buf2 = new Uint8Array([5, 6, 7, 8]).buffer;

    const [r1, r2] = await Promise.all([parsePngBuffer(buf1), parsePngBuffer(buf2)]);

    expect(r1.data).toEqual(new Uint8Array([1, 2, 3, 4]));
    expect(r2.data).toEqual(new Uint8Array([5, 6, 7, 8]));
  });
});
