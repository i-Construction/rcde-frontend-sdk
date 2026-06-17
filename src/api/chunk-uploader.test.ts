import { describe, it, expect, vi } from "vitest";
import { chunkedUpload } from "./chunk-uploader";

/** 指定バイト数の Uint8Array を生成（各バイトは index ベースの値） */
function makeBytes(size: number): Uint8Array {
  const arr = new Uint8Array(size);
  for (let i = 0; i < size; i++) arr[i] = i % 256;
  return arr;
}

/** Uint8Array を 1 回の read で全量流す ReadableStream にする */
function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

describe("chunkedUpload", () => {
  it("ArrayBuffer/Uint8Array を chunkSize ごとに分割して upload を呼ぶ", async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const data = makeBytes(25);

    await chunkedUpload(data, { upload, chunkSize: 10 });

    // 25 バイト / 10 = 3 チャンク（10, 10, 5）
    expect(upload).toHaveBeenCalledTimes(3);

    const calls = upload.mock.calls;
    // 各呼び出し: (chunk, part, offset, total)
    expect(calls[0][1]).toBe(0); // part
    expect(calls[0][2]).toBe(0); // offset
    expect(calls[0][3]).toBe(25); // total
    expect(calls[0][0].byteLength).toBe(10);

    expect(calls[1][1]).toBe(1);
    expect(calls[1][2]).toBe(10);
    expect(calls[1][0].byteLength).toBe(10);

    expect(calls[2][1]).toBe(2);
    expect(calls[2][2]).toBe(20);
    expect(calls[2][0].byteLength).toBe(5);
  });

  it("onProgress に累積送信バイト数と total を渡す", async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const data = makeBytes(25);

    await chunkedUpload(data, { upload, chunkSize: 10, onProgress });

    expect(onProgress.mock.calls).toEqual([
      [10, 25],
      [20, 25],
      [25, 25],
    ]);
  });

  it("chunkSize 未指定時は既定 5MiB で 1 チャンクになる（小さいデータ）", async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const data = makeBytes(100);

    await chunkedUpload(data, { upload });

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0].byteLength).toBe(100);
  });

  it("ReadableStream を chunkSize 境界で分割し、余り(carry)を最後に flush する", async () => {
    // 7+7+7=21 バイトを chunkSize=10 で流すと、境界をまたいで 10/10/1 に分割される。
    // chunkedUpload はストリームを事前消費しない（getTotalSize を呼ばない）ため
    // total は null になる。
    const upload = vi.fn().mockResolvedValue(undefined);
    const stream = streamOf(makeBytes(7), makeBytes(7), makeBytes(7));

    await chunkedUpload(stream, { upload, chunkSize: 10 });

    expect(upload).toHaveBeenCalledTimes(3);
    // 各チャンクのバイト数
    expect(upload.mock.calls.map((c) => c[0].byteLength)).toEqual([10, 10, 1]);
    // (chunk, part, offset, total): ストリームは総サイズ不明なので total=null
    expect(upload.mock.calls.map((c) => c[1])).toEqual([0, 1, 2]); // part
    expect(upload.mock.calls.map((c) => c[2])).toEqual([0, 10, 20]); // offset
    expect(upload.mock.calls.every((c) => c[3] === null)).toBe(true); // total
  });

  it("ReadableStream の onProgress は total=null で累積バイト数を渡す", async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const stream = streamOf(makeBytes(7), makeBytes(7), makeBytes(7));

    await chunkedUpload(stream, { upload, chunkSize: 10, onProgress });

    expect(onProgress.mock.calls).toEqual([
      [10, null],
      [20, null],
      [21, null],
    ]);
  });

  it("Blob を chunkSize ごとに分割する", async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const blob = new Blob([makeBytes(30)]);

    await chunkedUpload(blob, { upload, chunkSize: 10 });

    expect(upload).toHaveBeenCalledTimes(3);
    expect(upload.mock.calls.map((c) => c[0].byteLength)).toEqual([10, 10, 10]);
  });
});
