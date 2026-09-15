/**
 * ビューアコマンドを `window.postMessage` で流すときのチャンネル名。
 *
 * 送信側（`ViewerBridge`）と受信側（`Viewer`）の双方が参照する内部定数。
 * `src/index.ts` の `export * from "./bridge/viewerBridge"` に含めると
 * パッケージの公開名前空間へ `CHANNEL` が漏れるため、独立したモジュールに置く。
 */
export const CHANNEL = "RCDE_VIEWER_CMD";
