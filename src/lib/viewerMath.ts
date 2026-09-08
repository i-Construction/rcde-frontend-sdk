import { Vector2 } from "three";

/** 値を [min, max] の範囲に丸める。 */
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * 要素内のピクセル座標を正規化デバイス座標（NDC）へ変換する。
 * 要素の左上が (-1, 1)、中央が (0, 0)、右下が (1, -1) になる。
 *
 * `point` は要素の左上を原点とする座標（クライアント座標から要素のオフセットを引いたもの）、
 * `size` は要素の大きさ。`getBoundingClientRect()` の戻り値をそのまま `size` に渡せる。
 */
export const toNormalizedDeviceCoordinates = (
  point: { x: number; y: number },
  size: { width: number; height: number }
): Vector2 => new Vector2((point.x / size.width) * 2 - 1, -(point.y / size.height) * 2 + 1);
