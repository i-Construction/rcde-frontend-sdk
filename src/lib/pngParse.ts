import { PNG } from "pngjs/browser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePngBuffer(buffer: ArrayBuffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png
      .parse(buffer)
      .on("error", reject)
      .on("parsed", () => resolve(png));
  });
}
