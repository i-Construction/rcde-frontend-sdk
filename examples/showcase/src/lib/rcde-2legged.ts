/**
 * RCDE の 2-legged（クライアントクレデンシャル）認証。
 *
 * clientId / clientSecret はサーバー専用の環境変数から読み、ブラウザには渡さない。
 * 取得したアクセストークンはプロセス内にキャッシュし、期限が近づいたら再取得する。
 * このモジュールは Route Handler からのみ import すること。
 */

const EXPIRY_SKEW_SEC = 60;

export type RcdeToken = {
  accessToken: string;
  refreshToken: string;
  /** Unix time 秒 */
  expiresAt: number;
};

export type RcdeServerConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
};

export class MissingRcdeCredentialsError extends Error {
  constructor() {
    super("RCDE_CLIENT_ID / RCDE_CLIENT_SECRET が設定されていません。.env を作成してください。");
    this.name = "MissingRcdeCredentialsError";
  }
}

export function getRcdeApiBaseUrl(): string {
  return (process.env.RCDE_API_BASE_URL ?? "https://api.rcde.jp").replace(/\/$/, "");
}

/**
 * サーバー専用の認証設定を読む。未設定なら MissingRcdeCredentialsError を投げる。
 */
export function readServerConfig(): RcdeServerConfig {
  const clientId = process.env.RCDE_CLIENT_ID;
  const clientSecret = process.env.RCDE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new MissingRcdeCredentialsError();
  }
  return { clientId, clientSecret, baseUrl: getRcdeApiBaseUrl() };
}

export function hasServerConfig(): boolean {
  return Boolean(process.env.RCDE_CLIENT_ID && process.env.RCDE_CLIENT_SECRET);
}

// dev の HMR でモジュールが再評価されてもキャッシュを引き継ぐ
const globalCache = globalThis as typeof globalThis & {
  __rcdeTokenCache?: { token: RcdeToken; configKey: string };
  __rcdeTokenInFlight?: Promise<RcdeToken>;
};

function isExpiringSoon(expiresAtSec: number, nowSec: number): boolean {
  return expiresAtSec - nowSec <= EXPIRY_SKEW_SEC;
}

async function requestToken(config: RcdeServerConfig): Promise<RcdeToken> {
  const res = await fetch(`${config.baseUrl}/ext/v2/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RCDE トークン取得に失敗しました (HTTP ${res.status}): ${body}`);
  }
  return (await res.json()) as RcdeToken;
}

/**
 * キャッシュ済みトークンを返す。期限切れが近い場合のみ再取得する。
 * 同時呼び出しは in-flight の Promise を共有して重複リクエストを避ける。
 */
export async function getAccessToken(): Promise<RcdeToken> {
  const config = readServerConfig();
  const configKey = `${config.baseUrl}:${config.clientId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  const cached = globalCache.__rcdeTokenCache;
  if (
    cached !== undefined &&
    cached.configKey === configKey &&
    !isExpiringSoon(cached.token.expiresAt, nowSec)
  ) {
    return cached.token;
  }

  if (globalCache.__rcdeTokenInFlight !== undefined) {
    return globalCache.__rcdeTokenInFlight;
  }

  const inFlight = requestToken(config)
    .then((token) => {
      globalCache.__rcdeTokenCache = { token, configKey };
      return token;
    })
    .finally(() => {
      globalCache.__rcdeTokenInFlight = undefined;
    });

  globalCache.__rcdeTokenInFlight = inFlight;
  return inFlight;
}
