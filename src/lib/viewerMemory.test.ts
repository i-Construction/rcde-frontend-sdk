import { describe, expect, it } from "vitest";
import {
  evaluateViewerMemoryAlert,
  resolveViewerMemoryObservedBytes,
  resolveViewerMemoryTargetBytes,
  type ViewerMemorySample,
} from "./viewerMemory";

const baseSample: ViewerMemorySample = {
  timestamp: 1,
  source: "estimate",
  estimatedViewerBytes: 200,
  pageBytes: 300,
  jsHeapBytes: 250,
  loadedFileCount: 1,
  loadedTileCount: 4,
  compressedBytes: 80,
  decodedBytes: 120,
  visibleFileIds: [1],
};

describe("resolveViewerMemoryObservedBytes", () => {
  it("estimate / js-heap / page の3値を常に返す", () => {
    expect(resolveViewerMemoryObservedBytes(baseSample)).toEqual({
      estimateBytes: 200,
      jsHeapBytes: 250,
      pageBytes: 300,
    });
  });

  it("取得できない値は undefined のまま返す", () => {
    expect(
      resolveViewerMemoryObservedBytes({
        ...baseSample,
        pageBytes: undefined,
        jsHeapBytes: undefined,
      })
    ).toEqual({
      estimateBytes: 200,
      jsHeapBytes: undefined,
      pageBytes: undefined,
    });
  });
});

describe("resolveViewerMemoryTargetBytes", () => {
  const observed = resolveViewerMemoryObservedBytes(baseSample);

  it("対象ごとの値を返す", () => {
    expect(resolveViewerMemoryTargetBytes(observed, "estimate")).toBe(200);
    expect(resolveViewerMemoryTargetBytes(observed, "jsHeap")).toBe(250);
    expect(resolveViewerMemoryTargetBytes(observed, "page")).toBe(300);
  });

  it("取得できていない対象は undefined を返す", () => {
    expect(resolveViewerMemoryTargetBytes({ estimateBytes: 200 }, "page")).toBeUndefined();
  });
});

describe("evaluateViewerMemoryAlert", () => {
  it("閾値を超えた値だけが breach に含まれる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        estimate: { warningBytes: 280 },
        page: { warningBytes: 280 },
      },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.nextLevels).toEqual({ page: "warning" });
    expect(result.alert?.breaches).toEqual([
      { target: "page", level: "warning", thresholdBytes: 280, observedBytes: 300 },
    ]);
    expect(result.alert?.observedBytes).toEqual({
      estimateBytes: 200,
      jsHeapBytes: 250,
      pageBytes: 300,
    });
  });

  it("値ごとに異なるレベルを判定し、最も高いレベルをアラートレベルにする", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        jsHeap: { warningBytes: 240 },
        page: { warningBytes: 240, criticalBytes: 290 },
      },
    });

    expect(result.nextLevel).toBe("critical");
    expect(result.nextLevels).toEqual({ jsHeap: "warning", page: "critical" });
    expect(result.alert?.level).toBe("critical");
    expect(result.alert?.breaches.map((breach) => breach.target)).toEqual(["page", "jsHeap"]);
  });

  it("超過幅が大きい breach を先頭に並べる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        estimate: { criticalBytes: 190 },
        jsHeap: { criticalBytes: 200 },
        page: { criticalBytes: 200 },
      },
    });

    expect(result.alert?.breaches.map((breach) => breach.target)).toEqual([
      "page",
      "jsHeap",
      "estimate",
    ]);
  });

  it("閾値を設定していない値は判定対象にしない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        estimate: { warningBytes: 280 },
      },
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.nextLevels).toEqual({});
    expect(result.alert).toBeUndefined();
  });

  it("取得できていない値は判定対象にしない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: undefined },
      thresholds: {
        page: { warningBytes: 100 },
      },
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.nextLevels).toEqual({});
    expect(result.alert).toBeUndefined();
  });

  it("同じ alert level が継続している間は再通知しない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 320 },
      thresholds: {
        page: { warningBytes: 280 },
      },
      previousLevel: "warning",
      previousLevels: { page: "warning" },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert).toBeUndefined();
  });

  it("ヒステリシス幅の範囲では warning 状態を維持する", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 270 },
      thresholds: {
        page: { warningBytes: 280, hysteresisBytes: 20 },
      },
      previousLevel: "warning",
      previousLevels: { page: "warning" },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.nextLevels).toEqual({ page: "warning" });
    expect(result.alert).toBeUndefined();
  });

  it("ヒステリシスを下回ると alert level を解除する", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 200 },
      thresholds: {
        page: { warningBytes: 280, hysteresisBytes: 20 },
      },
      previousLevel: "warning",
      previousLevels: { page: "warning" },
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.nextLevels).toEqual({});
    expect(result.alert).toBeUndefined();
  });

  it("ヒステリシス状態は値ごとに独立している", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 470 },
      thresholds: {
        estimate: { warningBytes: 280, hysteresisBytes: 20 },
        page: { warningBytes: 280, criticalBytes: 480, hysteresisBytes: 20 },
      },
      previousLevel: "critical",
      previousLevels: { page: "critical" },
    });

    expect(result.nextLevel).toBe("critical");
    expect(result.nextLevels).toEqual({ page: "critical" });
    expect(result.alert).toBeUndefined();
  });

  it("critical から warning へダウングレードしたときは warning アラートを返す", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 430 },
      thresholds: {
        page: { warningBytes: 280, criticalBytes: 480, hysteresisBytes: 20 },
      },
      previousLevel: "critical",
      previousLevels: { page: "critical" },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert?.level).toBe("warning");
    expect(result.alert?.breaches).toEqual([
      { target: "page", level: "warning", thresholdBytes: 280, observedBytes: 430 },
    ]);
  });

  it("warningBytes のみ指定した場合でも warning 判定できる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        jsHeap: { warningBytes: 240 },
      },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert?.level).toBe("warning");
  });

  it("criticalBytes のみ指定した場合でも critical 判定できる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        page: { criticalBytes: 290 },
      },
    });

    expect(result.nextLevel).toBe("critical");
    expect(result.alert?.level).toBe("critical");
  });

  it("thresholds が空なら alert level を持たない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {},
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.nextLevels).toEqual({});
    expect(result.alert).toBeUndefined();
  });

  it("thresholds 未指定なら alert level を持たない", () => {
    const result = evaluateViewerMemoryAlert({ sample: baseSample });

    expect(result.nextLevel).toBeUndefined();
    expect(result.nextLevels).toEqual({});
    expect(result.alert).toBeUndefined();
  });
});
