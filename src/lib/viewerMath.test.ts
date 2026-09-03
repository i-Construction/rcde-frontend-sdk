import { describe, expect, it } from "vitest";
import { clamp, toNormalizedDeviceCoordinates } from "./viewerMath";

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

  it("NaN は範囲に丸められず、NaN のまま返る", () => {
    // Math.max(0, NaN) も Math.min(5, NaN) も NaN になるため、下限・上限では潰せない。
    // この挙動があるので src/bridge/viewerBridge.ts の受信境界で NaN を弾いている。
    expect(clamp(NaN, 0, 5)).toBeNaN();
  });
});

describe("toNormalizedDeviceCoordinates", () => {
  // 幅と高さを別の値にして、両者を取り違えた変換を検出できるようにする
  const size = { width: 800, height: 400 };

  it("要素の左上を指したとき、NDC は (-1, 1) になる", () => {
    const ndc = toNormalizedDeviceCoordinates({ x: 0, y: 0 }, size);
    expect(ndc.x).toBeCloseTo(-1);
    expect(ndc.y).toBeCloseTo(1);
  });

  it("要素の中央を指したとき、NDC は (0, 0) になる", () => {
    const ndc = toNormalizedDeviceCoordinates({ x: 400, y: 200 }, size);
    expect(ndc.x).toBeCloseTo(0);
    expect(ndc.y).toBeCloseTo(0);
  });

  it("要素の右下を指したとき、NDC は (1, -1) になる", () => {
    const ndc = toNormalizedDeviceCoordinates({ x: 800, y: 400 }, size);
    expect(ndc.x).toBeCloseTo(1);
    expect(ndc.y).toBeCloseTo(-1);
  });

  it("要素の左上と中央の中間を指したとき、NDC は (-0.5, 0.5) になる", () => {
    const ndc = toNormalizedDeviceCoordinates({ x: 200, y: 100 }, size);
    expect(ndc.x).toBeCloseTo(-0.5);
    expect(ndc.y).toBeCloseTo(0.5);
  });

  it("要素の左下寄りを指したとき、NDC は (-0.75, -0.5) になる", () => {
    // 幅と高さの正規化値を別の値にして（0.125 と 0.75）、x と y の分子を
    // 取り違えた変換を検出できるようにする。ほかの 4 点は x/width === y/height なので通ってしまう。
    const ndc = toNormalizedDeviceCoordinates({ x: 100, y: 300 }, size);
    expect(ndc.x).toBeCloseTo(-0.75);
    expect(ndc.y).toBeCloseTo(-0.5);
  });
});
