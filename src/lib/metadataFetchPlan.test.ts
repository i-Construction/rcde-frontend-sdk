import { describe, expect, it } from "vitest";
import { computeMetadataFetchPlan } from "./metadataFetchPlan";

// ---------------------------------------------------------------------------
// 1: 初回表示（キャッシュ空）
// ---------------------------------------------------------------------------
describe("初回表示（キャッシュ空）", () => {
  it("全ファイルがフェッチ対象になる", () => {
    const plan = computeMetadataFetchPlan([1, 2, 3], new Set());

    expect(plan.toFetch).toEqual([1, 2, 3]);
    expect(plan.toRemove).toEqual([]);
  });

  it("対象が空なら何も返さない", () => {
    const plan = computeMetadataFetchPlan([], new Set());

    expect(plan.toFetch).toEqual([]);
    expect(plan.toRemove).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2: 差分フェッチ（追加）
// ---------------------------------------------------------------------------
describe("ファイル追加時の差分", () => {
  it("新規ファイルのみフェッチ対象になる", () => {
    const cached = new Set([1, 2]);
    const plan = computeMetadataFetchPlan([1, 2, 3], cached);

    expect(plan.toFetch).toEqual([3]);
    expect(plan.toRemove).toEqual([]);
  });

  it("複数ファイルを同時追加した場合も正しく差分が算出される", () => {
    const cached = new Set([1]);
    const plan = computeMetadataFetchPlan([1, 2, 3, 4], cached);

    expect(plan.toFetch).toEqual([2, 3, 4]);
    expect(plan.toRemove).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3: 差分フェッチ（削除）
// ---------------------------------------------------------------------------
describe("ファイル非表示時の差分", () => {
  it("表示対象から外れたファイルが削除対象になる", () => {
    const cached = new Set([1, 2, 3]);
    const plan = computeMetadataFetchPlan([1, 3], cached);

    expect(plan.toFetch).toEqual([]);
    expect(plan.toRemove).toEqual([2]);
  });

  it("全ファイルを非表示にすると全てが削除対象になる", () => {
    const cached = new Set([1, 2, 3]);
    const plan = computeMetadataFetchPlan([], cached);

    expect(plan.toFetch).toEqual([]);
    expect(plan.toRemove).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// 4: 追加と削除の同時発生
// ---------------------------------------------------------------------------
describe("追加と削除の同時発生", () => {
  it("追加・維持・削除が混在するケース", () => {
    const cached = new Set([1, 2, 3]);
    //   target = [2, 3, 4, 5]
    //   → toFetch = [4, 5]（新規）
    //   → toRemove = [1]（キャッシュにはあるが target にない）
    const plan = computeMetadataFetchPlan([2, 3, 4, 5], cached);

    expect(plan.toFetch).toEqual([4, 5]);
    expect(plan.toRemove).toEqual([1]);
  });

  it("対象が完全に入れ替わるケース", () => {
    const cached = new Set([1, 2]);
    const plan = computeMetadataFetchPlan([3, 4], cached);

    expect(plan.toFetch).toEqual([3, 4]);
    expect(plan.toRemove).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// 5: 全キャッシュ済み（フェッチ不要）
// ---------------------------------------------------------------------------
describe("全キャッシュ済み", () => {
  it("全ファイルがキャッシュにある場合はフェッチ・削除ともに空", () => {
    const cached = new Set([1, 2, 3]);
    const plan = computeMetadataFetchPlan([1, 2, 3], cached);

    expect(plan.toFetch).toEqual([]);
    expect(plan.toRemove).toEqual([]);
  });

  it("順序が異なっていてもキャッシュヒットする", () => {
    const cached = new Set([3, 1, 2]);
    const plan = computeMetadataFetchPlan([2, 3, 1], cached);

    expect(plan.toFetch).toEqual([]);
    expect(plan.toRemove).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6: toFetch の順序が targetIds の順序を保つ
// ---------------------------------------------------------------------------
describe("toFetch の順序", () => {
  it("targetIds 内の出現順序を維持する", () => {
    const cached = new Set([2]);
    const plan = computeMetadataFetchPlan([5, 3, 1], cached);

    expect(plan.toFetch).toEqual([5, 3, 1]);
  });
});
