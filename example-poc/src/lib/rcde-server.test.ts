import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

// --- SDK クライアントのモック ---------------------------------------------
// vi.mock の factory はファイル先頭へ巻き上げられるため、クラス定義は factory 内に置く。
// テスト側は戻り値と（別途定義した）storeToken/getStoredToken モックのみを検証する。
vi.mock("@i-con/frontend-sdk/api-server", async (importOriginal) => {
  // isExpiringSoon は純関数なので本物をそのまま温存し、結合を本物で検証する。
  // クライアント2種だけモックに差し替える。
  const actual =
    await importOriginal<typeof import("@i-con/frontend-sdk/api-server")>();

  class MockRCDEClient2Legged {
    token?: { accessToken: string; refreshToken: string; expiresAt: number };
    constructor(_props: unknown) {}
    authenticate = vi.fn(async () => {
      // authenticate 成功で内部 token を埋める（getToken が参照する）
      this.token = {
        accessToken: "fresh-2legged-at",
        refreshToken: "rt",
        expiresAt: 999,
      };
    });
    getToken = vi.fn(() => {
      if (!this.token) throw new Error("Token is not available");
      return this.token;
    });
  }

  class MockRCDEClient3Legged {
    constructor(_props: unknown) {}
    setToken = vi.fn();
    refreshToken = vi.fn(async () => {});
    getToken = vi.fn(() => ({
      accessToken: "refreshed-3legged-at",
      refreshToken: "r2",
      expiresAt: 111,
    }));
  }

  return {
    ...actual, // 本物の isExpiringSoon を温存（再実装しない）
    RCDEClient2Legged: MockRCDEClient2Legged,
    RCDEClient3Legged: MockRCDEClient3Legged,
  };
});

// --- auth-store のモック ---------------------------------------------------
const getStoredToken = vi.fn();
const storeToken = vi.fn(async () => {});
vi.mock("./auth-store", () => ({
  getStoredToken: (...args: unknown[]) => getStoredToken(...args),
  storeToken: (...args: unknown[]) => storeToken(...args),
}));

import { getAuthType, resolveAccessToken } from "./rcde-server";

beforeEach(() => {
  getStoredToken.mockReset();
  storeToken.mockReset();
  storeToken.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("getAuthType", () => {
  it("AUTH_TYPE 未設定は '2legged' を既定とする", () => {
    vi.stubEnv("AUTH_TYPE", "");
    expect(getAuthType()).toBe("2legged");
  });

  it("AUTH_TYPE='3legged' のとき '3legged' を返す", () => {
    vi.stubEnv("AUTH_TYPE", "3legged");
    expect(getAuthType()).toBe("3legged");
  });

  it("想定外の値は '2legged' にフォールバックする", () => {
    vi.stubEnv("AUTH_TYPE", "unknown");
    expect(getAuthType()).toBe("2legged");
  });
});

describe("resolveAccessToken", () => {
  it("セッションが無い場合は undefined を返す", async () => {
    getStoredToken.mockResolvedValue(undefined);
    expect(await resolveAccessToken()).toBeUndefined();
  });

  it("2-legged: authenticate して新しい accessToken を保存・返却する", async () => {
    vi.stubEnv("AUTH_TYPE", "2legged");
    getStoredToken.mockResolvedValue({
      accessToken: "old",
      refreshToken: "old-r",
      expiresAt: 1,
    });

    const result = await resolveAccessToken();

    expect(result).toBe("fresh-2legged-at");
    expect(storeToken).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "fresh-2legged-at" })
    );
  });

  it("3-legged: 期限まで 60 秒以下なら refresh し新トークンを保存・返却する", async () => {
    vi.stubEnv("AUTH_TYPE", "3legged");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    const now = Math.floor(Date.parse("2025-01-01T00:00:00.000Z") / 1000);

    getStoredToken.mockResolvedValue({
      accessToken: "near-expiry",
      refreshToken: "r",
      expiresAt: now + 30, // 60 秒以内に期限切れ
    });

    const result = await resolveAccessToken();

    expect(result).toBe("refreshed-3legged-at");
    expect(storeToken).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "refreshed-3legged-at" })
    );
  });

  it("3-legged: 期限に余裕があれば既存 accessToken を再利用する", async () => {
    vi.stubEnv("AUTH_TYPE", "3legged");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    const now = Math.floor(Date.parse("2025-01-01T00:00:00.000Z") / 1000);

    getStoredToken.mockResolvedValue({
      accessToken: "still-valid",
      refreshToken: "r",
      expiresAt: now + 3600, // 十分な余裕
    });

    const result = await resolveAccessToken();

    expect(result).toBe("still-valid");
    expect(storeToken).not.toHaveBeenCalled();
  });
});
