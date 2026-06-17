import { describe, it, expect } from "vitest";
import { isExpiringSoon } from "./common";

describe("isExpiringSoon", () => {
  const NOW = 1_000_000; // 任意の固定「現在時刻」（秒）

  it("期限まで skew より十分余裕があれば false", () => {
    expect(isExpiringSoon(NOW + 3600, NOW)).toBe(false);
  });

  it("ちょうど skew 秒前（境界 = skew）は true（<= 判定）", () => {
    expect(isExpiringSoon(NOW + 60, NOW)).toBe(true);
  });

  it("skew 直前（残り 61 秒）はまだ false", () => {
    expect(isExpiringSoon(NOW + 61, NOW)).toBe(false);
  });

  it("既に期限切れ（負の残り）は true", () => {
    expect(isExpiringSoon(NOW - 10, NOW)).toBe(true);
  });

  it("expiresAt が undefined / 0 のときは false（判定不能は更新しない）", () => {
    expect(isExpiringSoon(undefined, NOW)).toBe(false);
    expect(isExpiringSoon(0, NOW)).toBe(false);
  });

  it("skew を任意指定できる（既定より大きい skew で true になる）", () => {
    expect(isExpiringSoon(NOW + 120, NOW, 180)).toBe(true);
  });
});
