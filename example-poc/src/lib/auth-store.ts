import { cookies } from "next/headers";

const TOKEN_COOKIE = "rcde_token";
const REFRESH_COOKIE = "rcde_refresh";
const EXPIRES_COOKIE = "rcde_expires";

type StoredToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export async function storeToken(token: StoredToken) {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24;

  cookieStore.set(TOKEN_COOKIE, token.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  cookieStore.set(REFRESH_COOKIE, token.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  cookieStore.set(EXPIRES_COOKIE, String(token.expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function getStoredToken(): Promise<StoredToken | undefined> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  const expiresAt = cookieStore.get(EXPIRES_COOKIE)?.value;

  if (!accessToken || !refreshToken || !expiresAt) {
    return undefined;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAt),
  };
}

export async function clearToken() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(EXPIRES_COOKIE);
}
