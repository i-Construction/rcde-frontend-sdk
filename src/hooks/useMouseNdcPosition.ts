import { useCallback } from "react";
import { toNormalizedDeviceCoordinates } from "../lib/viewerMath";

/**
 * マウスイベントのクライアント座標を、キャンバス内の正規化デバイス座標（NDC）へ変換する関数を返す。
 * キャンバスの左上が (-1, 1)、中央が (0, 0)、右下が (1, -1) になる。
 *
 * `getBoundingClientRect()` によるキャンバスのオフセット減算はこのフックが担い、
 * `toNormalizedDeviceCoordinates` は DOM を知らない純粋な計算のままにする。
 */
export const useMouseNdcPosition = (props: { canvas: HTMLCanvasElement }) => {
  const { canvas } = props;
  return useCallback(
    (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return toNormalizedDeviceCoordinates({ x: e.clientX - rect.x, y: e.clientY - rect.y }, rect);
    },
    [canvas]
  );
};
