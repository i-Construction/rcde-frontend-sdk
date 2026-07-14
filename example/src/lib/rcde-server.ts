import "server-only";
import { getStoredToken, storeToken } from "./auth-store";
import { create2LeggedClient } from "./rcde-clients";

export { create2LeggedClient } from "./rcde-clients";

/**
 * プロキシ向けに有効な accessToken を取得する。
 * 2-legged: clientSecret で都度 authenticate
 */
export async function resolveAccessToken(): Promise<string | undefined> {
  const session = await getStoredToken();
  if (session === undefined) {
    return undefined;
  }

  const client = create2LeggedClient();
  await client.authenticate();
  const token = client.getToken();
  await storeToken(token);
  return token.accessToken;
}
