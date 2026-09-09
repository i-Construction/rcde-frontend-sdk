export const MEBIBYTE = 1024 * 1024;

/** バイト数を人が読める単位に整形する。undefined は「未取得」と表示する。 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) {
    return "未取得";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Unix time ミリ秒を HH:mm:ss で整形する。 */
export function formatTime(timestamp: number | undefined): string {
  if (timestamp === undefined) {
    return "-";
  }
  return new Date(timestamp).toLocaleTimeString("ja-JP", { hour12: false });
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined) {
    return "-";
  }
  return value.toLocaleString("ja-JP");
}

/** Vector3 相当のオブジェクトを小数3桁で整形する。 */
export function formatVector(point: { x: number; y: number; z: number }): string {
  return `(${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)})`;
}

export function formatJson(value: unknown): string {
  return JSON.stringify(value, jsonReplacer, 2);
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof ArrayBuffer) {
    return `ArrayBuffer(${value.byteLength} bytes)`;
  }
  return value;
}
