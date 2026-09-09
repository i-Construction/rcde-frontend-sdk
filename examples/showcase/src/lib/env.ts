/**
 * ブラウザに公開される設定値。`NEXT_PUBLIC_` 変数はビルド時に埋め込まれるため、
 * 動的な参照ではなくリテラルで読む必要がある。
 */

/** SDK の `app.baseUrl` に渡す値。既定は自前プロキシ。 */
export const RCDE_PROXY_BASE_URL = process.env.NEXT_PUBLIC_RCDE_PROXY_BASE_URL ?? "/api/rcde";

function parseId(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const DEFAULT_CONSTRUCTION_ID = parseId(process.env.NEXT_PUBLIC_DEFAULT_CONSTRUCTION_ID);
export const DEFAULT_CONTRACT_ID = parseId(process.env.NEXT_PUBLIC_DEFAULT_CONTRACT_ID);
