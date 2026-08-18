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
});
