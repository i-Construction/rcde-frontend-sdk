import {
  RCDEClient2Legged,
  RCDEClient3Legged,
  isExpiringSoon,
} from "@i-con/frontend-sdk/api-server";
import { getStoredToken, storeToken } from "./auth-store";

export function getAuthType(): "2legged" | "3legged" {
  const authType = process.env.AUTH_TYPE ?? "2legged";
  if (authType === "3legged") {
    return "3legged";
  }
  return "2legged";
}

export function create2LeggedClient() {
  return new RCDEClient2Legged({
    baseUrl: process.env.RCDE_API_BASE_URL!,
    clientId: process.env.RCDE_CLIENT_ID!,
    clientSecret: process.env.RCDE_CLIENT_SECRET!,
  });
}

export function create3LeggedClient() {
  return new RCDEClient3Legged({
    baseUrl: process.env.RCDE_API_BASE_URL!,
    clientId: process.env.RCDE_CLIENT_ID!,
    clientSecret: process.env.RCDE_CLIENT_SECRET!,
    authCode: "",
  });
}

/**
 * プロキシ向けに有効な accessToken を取得する。
 * 2-legged: clientSecret で都度 authenticate（/api/constructions と同じ）
 * 3-legged: Cookie のトークンを使用し、期限切れ前なら refresh
 */
export async function resolveAccessToken(): Promise<string | undefined> {
  const session = await getStoredToken();
  if (!session) {
    return undefined;
  }

  if (getAuthType() === "2legged") {
    const client = create2LeggedClient();
    await client.authenticate();
    const token = client.getToken();
    await storeToken(token);
    return token.accessToken;
  }

  const client = create3LeggedClient();
  client.setToken(session);

  const nowSec = Math.floor(Date.now() / 1000);
  if (isExpiringSoon(session.expiresAt, nowSec)) {
    await client.refreshToken();
    const refreshed = client.getToken();
    await storeToken(refreshed);
    return refreshed.accessToken;
  }

  return session.accessToken;
}
