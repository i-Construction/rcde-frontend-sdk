import type { AuthType } from "./rcdeApiTypes";

/**
 * R-CDE API へ接続するためのアプリケーション設定。
 *
 * `Viewer` と `ClientProvider` の双方が参照する。
 * どちらかのモジュールに置くと components と contexts が相互に import し合う
 * 循環になるため、依存を持たない型モジュールに置く。
 */
export type RCDEAppConfig = {
  token: string;
  baseUrl?: string;
  /**
   * 認証方式。`"2legged"` のみ。省略時も 2-legged。
   * `"3legged"` は型でも実行時でも受け付けない。
   */
  authType?: AuthType;
};
