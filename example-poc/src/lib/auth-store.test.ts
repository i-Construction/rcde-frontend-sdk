import { describe, it, expect, vi, beforeEach } from "vitest";

/** next/headers の cookies() が返す store のモック */
const store = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => store),
}));

import { storeToken, getStoredToken, clearToken } from "./auth-store";

const TOKEN_COOKIE = "rcde_token";
const REFRESH_COOKIE = "rcde_refresh";
const EXPIRES_COOKIE = "rcde_expires";

beforeEach(() => {
  store.set.mockReset();
  store.get.mockReset();
  store.delete.mockReset();
});

describe("storeToken", () => {
  it("token / refresh / expires の 3 cookie を共通オプション付きで set する", async () => {
    await storeToken({ accessToken: "a", refreshToken: "r", expiresAt: 123 });

    expect(store.set).toHaveBeenCalledTimes(3);

    const byName = Object.fromEntries(
      store.set.mock.calls.map(([name, value, opts]) => [name, { value, opts }])
    );

    expect(byName[TOKEN_COOKIE].value).toBe("a");
    expect(byName[REFRESH_COOKIE].value).toBe("r");
    expect(byName[EXPIRES_COOKIE].value).toBe("123"); // String 変換

    // セキュリティ契約（httpOnly / sameSite）のみ検証する
    for (const name of [TOKEN_COOKIE, REFRESH_COOKIE, EXPIRES_COOKIE]) {
      expect(byName[name].opts).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
      });
    }
  });
});

describe("getStoredToken", () => {
  it("全 cookie が揃えば復元し expiresAt を Number に変換する", async () => {
    store.get.mockImplementation((name: string) => {
      const map: Record<string, string> = {
        [TOKEN_COOKIE]: "a",
        [REFRESH_COOKIE]: "r",
        [EXPIRES_COOKIE]: "456",
      };
      return map[name] ? { value: map[name] } : undefined;
    });

    const token = await getStoredToken();
    expect(token).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 456,
    });
  });

  it("いずれかの cookie が欠落していたら undefined を返す", async () => {
    store.get.mockImplementation((name: string) => {
      // refresh が無い
      const map: Record<string, string> = {
        [TOKEN_COOKIE]: "a",
        [EXPIRES_COOKIE]: "456",
      };
      return map[name] ? { value: map[name] } : undefined;
    });

    expect(await getStoredToken()).toBeUndefined();
  });
});

describe("clearToken", () => {
  it("3 つの cookie を delete する", async () => {
    await clearToken();
    expect(store.delete).toHaveBeenCalledWith(TOKEN_COOKIE);
    expect(store.delete).toHaveBeenCalledWith(REFRESH_COOKIE);
    expect(store.delete).toHaveBeenCalledWith(EXPIRES_COOKIE);
  });
});
