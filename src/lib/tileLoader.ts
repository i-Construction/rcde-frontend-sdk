/**
 * タイルの Position / Color データの取得とパースを行うコア関数。
 * color 指定時は Position と Color を並列にフェッチ・パースし、
 * 未指定時は Position のみを取得する。
 *
 * ContractFileView の loader コールバックから呼ばれる。
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedPng = any;
type FetchBuffer = () => Promise<ArrayBuffer | undefined>;
type PngParser = (buffer: ArrayBuffer) => Promise<ParsedPng>;

export type TileLoadResult = {
  position: ParsedPng;
  color?: ParsedPng;
  compressedBytes: number;
  decodedBytes: number;
};

export async function loadTile(
  fetchPosition: FetchBuffer,
  fetchColor: FetchBuffer | undefined,
  parsePng: PngParser
): Promise<TileLoadResult> {
  if (fetchColor) {
    const [pBuffer, cBuffer] = await Promise.all([fetchPosition(), fetchColor()]);
    if (pBuffer === undefined || cBuffer === undefined) {
      throw new Error("Failed to load PNG buffer");
    }
    const [pParsed, cParsed] = await Promise.all([parsePng(pBuffer), parsePng(cBuffer)]);
    return {
      position: pParsed,
      color: cParsed,
      compressedBytes: pBuffer.byteLength + cBuffer.byteLength,
      decodedBytes: pParsed.data.byteLength + cParsed.data.byteLength,
    };
  }

  const pBuffer = await fetchPosition();
  if (pBuffer === undefined) {
    throw new Error("Failed to load PNG buffer");
  }
  const pParsed = await parsePng(pBuffer);
  return {
    position: pParsed,
    compressedBytes: pBuffer.byteLength,
    decodedBytes: pParsed.data.byteLength,
  };
}
