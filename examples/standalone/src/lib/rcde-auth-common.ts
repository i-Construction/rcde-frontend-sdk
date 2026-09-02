export type RcdeToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type RcdeClientProps = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};

const DEFAULT_EXPIRY_SKEW_SEC = 60;

/**
 * アクセストークンがまもなく期限切れかを判定する。
 */
export function isExpiringSoon(
  expiresAtSec: number | undefined,
  nowSec: number,
  skewSec = DEFAULT_EXPIRY_SKEW_SEC
): boolean {
  if (expiresAtSec === undefined) {
    return false;
  }
  return expiresAtSec - nowSec <= skewSec;
}

export async function readJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export function createJsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}
