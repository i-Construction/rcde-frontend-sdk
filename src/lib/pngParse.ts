import { PNG } from "pngjs/browser";

export type ParsedPng = {
  data: Uint8Array;
  width: number;
  height: number;
};

export function parsePngBuffer(buffer: ArrayBuffer): Promise<ParsedPng> {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png
      .parse(buffer)
      .on("error", reject)
      .on("parsed", () => resolve({ data: png.data, width: png.width, height: png.height }));
  });
}
