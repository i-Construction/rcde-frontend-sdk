import { useCallback } from "react";
import { toNormalizedDeviceCoordinates } from "../lib/viewerMath";

/**
 * マウスイベントのクライアント座標を、キャンバス内の正規化デバイス座標（NDC）へ変換する関数を返す。
 * キャンバスの左上が (-1, 1)、中央が (0, 0)、右下が (1, -1) になる。
 *
 * `getBoundingClientRect()` によるキャンバスのオフセット減算はこのフックが担い、
 * `toNormalizedDeviceCoordinates` は DOM を知らない純粋な計算のままにする。
 *
 * `rect.x` は `rect.left` と等しい。CSSOM View の `left` は `min(x, x + width)` として導出され、
 * `getBoundingClientRect()` が返す `DOMRect` の `width` / `height` は非負だからで、仕様上の保証である
 * （手で作った `new DOMRect(0, 0, -10, -10)` のような負の矩形には当てはまらない）。
 *
 * キャンバスの位置と大きさはウィンドウサイズ変更やサイドバーの開閉で変わるので、
 * rect はレンダー時にキャッシュせずイベントごとに読み直す。
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
