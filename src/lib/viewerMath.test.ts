import { describe, expect, it } from "vitest";
import { clamp } from "./viewerMath";

describe("clamp", () => {
  it("下限と上限の間にある値は、そのまま返す", () => {
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it("下限を下回る値は、下限まで引き上げられる", () => {
    expect(clamp(-2, 0, 5)).toBe(0);
  });

  it("上限を超える値は、上限まで引き下げられる", () => {
    expect(clamp(8, 0, 5)).toBe(5);
  });

  it("下限ちょうどの値は、そのまま返す", () => {
    expect(clamp(0, 0, 5)).toBe(0);
  });

  it("上限ちょうどの値は、そのまま返す", () => {
    expect(clamp(5, 0, 5)).toBe(5);
  });
});
