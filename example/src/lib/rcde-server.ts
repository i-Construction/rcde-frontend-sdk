import "server-only";
import { isExpiringSoon } from "./rcde-auth-common";
import { getStoredToken, storeToken } from "./auth-store";
import { create2LeggedClient } from "./rcde-clients";

export { create2LeggedClient } from "./rcde-clients";

/**
 * プロキシ向けに有効な accessToken を取得する。
 * Cookie に保存済みのトークンをまず再利用し、期限間近（`isExpiringSoon`）のときだけ
 * refreshToken を試み、失敗時は clientSecret での authenticate にフォールバックする。
 */
export async function resolveAccessToken(): Promise<string | undefined> {
  const session = await getStoredToken();
  if (session === undefined) {
    return undefined;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!isExpiringSoon(session.expiresAt, nowSec)) {
    return session.accessToken;
  }

  const client = create2LeggedClient();
  client.setToken(session);
  try {
    await client.refreshToken();
  } catch {
    await client.authenticate();
  }

  const token = client.getToken();
  await storeToken(token);
  return token.accessToken;
}
