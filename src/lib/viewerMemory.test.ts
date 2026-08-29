import { describe, expect, it } from "vitest";
import {
  evaluateViewerMemoryAlert,
  resolveViewerMemoryObservedBytes,
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
  it("max-available では利用可能な最大値を返す", () => {
    expect(resolveViewerMemoryObservedBytes(baseSample, "max-available")).toBe(300);
  });

  it("指定したソースの値を返す", () => {
    expect(resolveViewerMemoryObservedBytes(baseSample, "estimate")).toBe(200);
    expect(resolveViewerMemoryObservedBytes(baseSample, "js-heap")).toBe(250);
    expect(resolveViewerMemoryObservedBytes(baseSample, "page")).toBe(300);
  });

  it("pageBytes と jsHeapBytes が未取得でも max-available は estimate を使う", () => {
    expect(
      resolveViewerMemoryObservedBytes(
        { ...baseSample, pageBytes: undefined, jsHeapBytes: undefined },
        "max-available"
      )
    ).toBe(200);
  });
});

describe("evaluateViewerMemoryAlert", () => {
  it("warning 閾値を初回超過したときに warning アラートを返す", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        warningBytes: 280,
        criticalBytes: 400,
        source: "max-available",
      },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert?.level).toBe("warning");
    expect(result.alert?.observedBytes).toBe(300);
  });

  it("critical 閾値を超えたときに critical アラートを返す", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 500 },
      thresholds: {
        warningBytes: 280,
        criticalBytes: 480,
        source: "page",
      },
    });

    expect(result.nextLevel).toBe("critical");
    expect(result.alert?.level).toBe("critical");
    expect(result.alert?.thresholdBytes).toBe(480);
  });

  it("同じ alert level が継続している間は再通知しない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 320 },
      thresholds: {
        warningBytes: 280,
        source: "page",
      },
      previousLevel: "warning",
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert).toBeUndefined();
  });

  it("ヒステリシス幅の範囲では warning 状態を維持する", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 270 },
      thresholds: {
        warningBytes: 280,
        source: "page",
        hysteresisBytes: 20,
      },
      previousLevel: "warning",
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert).toBeUndefined();
  });

  it("ヒステリシスを下回ると alert level を解除する", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 200 },
      thresholds: {
        warningBytes: 280,
        source: "page",
        hysteresisBytes: 20,
      },
      previousLevel: "warning",
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.alert).toBeUndefined();
  });

  it("critical 付近で揺れてもヒステリシス幅の間は critical を維持する", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 470 },
      thresholds: {
        warningBytes: 280,
        criticalBytes: 480,
        source: "page",
        hysteresisBytes: 20,
      },
      previousLevel: "critical",
    });

    expect(result.nextLevel).toBe("critical");
    expect(result.alert).toBeUndefined();
  });

  it("critical から warning へダウングレードしたときは warning アラートを返す", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 430 },
      thresholds: {
        warningBytes: 280,
        criticalBytes: 480,
        source: "page",
        hysteresisBytes: 20,
      },
      previousLevel: "critical",
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert?.level).toBe("warning");
  });

  it("監視対象ソースが未取得なら alert を出さない", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: undefined },
      thresholds: {
        warningBytes: 280,
        source: "page",
      },
    });

    expect(result.nextLevel).toBeUndefined();
    expect(result.alert).toBeUndefined();
  });

  it("warningBytes のみ指定した場合でも warning 判定できる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: baseSample,
      thresholds: {
        warningBytes: 280,
        source: "max-available",
      },
    });

    expect(result.nextLevel).toBe("warning");
    expect(result.alert?.level).toBe("warning");
  });

  it("criticalBytes のみ指定した場合でも critical 判定できる", () => {
    const result = evaluateViewerMemoryAlert({
      sample: { ...baseSample, pageBytes: 500 },
      thresholds: {
        criticalBytes: 480,
        source: "page",
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
    expect(result.alert).toBeUndefined();
  });
});
