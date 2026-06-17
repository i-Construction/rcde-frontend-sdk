export type ClientProps = {
  domain?: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};

export interface RCDEClient {
  isTokenAvailable(): void;
  refreshToken(): Promise<void>;
}

/**
 * アクセストークンが「まもなく期限切れ」かを判定する純関数。
 * リフレッシュ境界の判定ロジックを一箇所に集約し、クライアントとサーバ側の
 * 重複を防ぐ。
 *
 * @param expiresAtSec トークンの有効期限（秒 since epoch）
 * @param nowSec       現在時刻（秒 since epoch）
 * @param skewSec      期限切れの何秒前から「まもなく」とみなすか（既定 60 秒）
 */
export function isExpiringSoon(
  expiresAtSec: number | undefined,
  nowSec: number,
  skewSec = 60
): boolean {
  if (!expiresAtSec) return false;
  return expiresAtSec - nowSec <= skewSec;
}
