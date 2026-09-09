export type ViewerMemorySource = "estimate" | "js-heap" | "browser-precise";

export type ViewerMemoryAlertLevel = "warning" | "critical";

/** 閾値判定の対象。サンプルごとに 3 値すべてを観測し、設定された対象だけを判定する。 */
export type ViewerMemoryThresholdTarget = "estimate" | "jsHeap" | "page";

/**
 * 1 サンプルで観測できたメモリ量。
 *
 * `estimateBytes` は常に得られるが、`jsHeapBytes` / `pageBytes` はブラウザが
 * 対応していない場合に undefined になる。
 */
export type ViewerMemoryObservedBytes = {
  estimateBytes: number;
  jsHeapBytes?: number;
  pageBytes?: number;
};

export type ViewerFileMemoryEstimate = {
  fileId: number;
  loadedTileCount: number;
  compressedBytes: number;
  decodedBytes: number;
  totalBytes: number;
};

export type ViewerMemorySample = {
  timestamp: number;
  source: ViewerMemorySource;
  estimatedViewerBytes: number;
  pageBytes?: number;
  pageBytesMeasuredAt?: number;
  jsHeapBytes?: number;
  loadedFileCount: number;
  loadedTileCount: number;
  compressedBytes: number;
  decodedBytes: number;
  geometryCount?: number;
  textureCount?: number;
  visibleFileIds: number[];
};

export type ViewerMemoryThreshold = {
  warningBytes?: number;
  criticalBytes?: number;
  hysteresisBytes?: number;
};

/** 対象ごとに独立した閾値。指定した対象だけが判定され、省略した対象は無視される。 */
export type ViewerMemoryThresholds = {
  [Target in ViewerMemoryThresholdTarget]?: ViewerMemoryThreshold;
};

/** 対象ごとの現在レベル。ヒステリシス判定に使うため対象単位で保持する。 */
export type ViewerMemoryAlertLevels = {
  [Target in ViewerMemoryThresholdTarget]?: ViewerMemoryAlertLevel;
};

export type ViewerMemoryThresholdBreach = {
  target: ViewerMemoryThresholdTarget;
  level: ViewerMemoryAlertLevel;
  thresholdBytes: number;
  observedBytes: number;
};

export type ViewerMemoryAlert = {
  /** `breaches` のうち最も高いレベル。 */
  level: ViewerMemoryAlertLevel;
  /** 深刻な超過が先頭に来るよう並べ替え済み。 */
  breaches: ViewerMemoryThresholdBreach[];
  observedBytes: ViewerMemoryObservedBytes;
  sample: ViewerMemorySample;
};

export type ViewerMemoryMonitoringOptions = {
  enabled?: boolean;
  sampleIntervalMs?: number;
  thresholds?: ViewerMemoryThresholds;
  onSample?: (sample: ViewerMemorySample) => void;
  onAlert?: (alert: ViewerMemoryAlert) => void;
  onAlertLevelChange?: (
    level: ViewerMemoryAlertLevel | undefined,
    sample: ViewerMemorySample
  ) => void;
};

type EvaluateViewerMemoryAlertArgs = {
  sample: ViewerMemorySample;
  thresholds?: ViewerMemoryThresholds;
  previousLevel?: ViewerMemoryAlertLevel;
  previousLevels?: ViewerMemoryAlertLevels;
};

type EvaluateViewerMemoryAlertResult = {
  nextLevel?: ViewerMemoryAlertLevel;
  nextLevels: ViewerMemoryAlertLevels;
  alert?: ViewerMemoryAlert;
};

const DEFAULT_HYSTERESIS_BYTES = 32 * 1024 * 1024;

const THRESHOLD_TARGETS: readonly ViewerMemoryThresholdTarget[] = ["estimate", "jsHeap", "page"];

const LEVEL_WEIGHTS: Record<ViewerMemoryAlertLevel, number> = { warning: 1, critical: 2 };

export function resolveViewerMemoryObservedBytes(
  sample: ViewerMemorySample
): ViewerMemoryObservedBytes {
  return {
    estimateBytes: sample.estimatedViewerBytes,
    jsHeapBytes: sample.jsHeapBytes,
    pageBytes: sample.pageBytes,
  };
}

export function resolveViewerMemoryTargetBytes(
  observedBytes: ViewerMemoryObservedBytes,
  target: ViewerMemoryThresholdTarget
): number | undefined {
  switch (target) {
    case "estimate":
      return observedBytes.estimateBytes;
    case "jsHeap":
      return observedBytes.jsHeapBytes;
    case "page":
      return observedBytes.pageBytes;
  }
}

function evaluateTargetLevel(
  observedBytes: number,
  threshold: ViewerMemoryThreshold,
  previousLevel: ViewerMemoryAlertLevel | undefined
): ViewerMemoryAlertLevel | undefined {
  const warningBytes = threshold.warningBytes;
  const criticalBytes = threshold.criticalBytes;
  const hysteresisBytes = threshold.hysteresisBytes ?? DEFAULT_HYSTERESIS_BYTES;

  if (previousLevel === "critical" && criticalBytes !== undefined) {
    if (observedBytes >= Math.max(0, criticalBytes - hysteresisBytes)) {
      return "critical";
    }
    if (warningBytes !== undefined && observedBytes >= warningBytes) {
      return "warning";
    }
    return undefined;
  }

  if (previousLevel === "warning" && warningBytes !== undefined) {
    if (criticalBytes !== undefined && observedBytes >= criticalBytes) {
      return "critical";
    }
    if (observedBytes >= Math.max(0, warningBytes - hysteresisBytes)) {
      return "warning";
    }
    return undefined;
  }

  if (criticalBytes !== undefined && observedBytes >= criticalBytes) {
    return "critical";
  }
  if (warningBytes !== undefined && observedBytes >= warningBytes) {
    return "warning";
  }
  return undefined;
}

export function evaluateViewerMemoryAlert({
  sample,
  thresholds,
  previousLevel,
  previousLevels,
}: EvaluateViewerMemoryAlertArgs): EvaluateViewerMemoryAlertResult {
  const observedBytes = resolveViewerMemoryObservedBytes(sample);
  const nextLevels: ViewerMemoryAlertLevels = {};
  const breaches: ViewerMemoryThresholdBreach[] = [];
  let nextLevel: ViewerMemoryAlertLevel | undefined;

  for (const target of THRESHOLD_TARGETS) {
    const threshold = thresholds?.[target];
    const targetBytes = resolveViewerMemoryTargetBytes(observedBytes, target);
    if (threshold === undefined || targetBytes === undefined) {
      continue;
    }

    const targetLevel = evaluateTargetLevel(targetBytes, threshold, previousLevels?.[target]);
    if (targetLevel === undefined) {
      continue;
    }

    nextLevels[target] = targetLevel;

    const thresholdBytes =
      targetLevel === "critical" ? threshold.criticalBytes : threshold.warningBytes;
    if (thresholdBytes !== undefined) {
      breaches.push({ target, level: targetLevel, thresholdBytes, observedBytes: targetBytes });
    }

    if (nextLevel === undefined || LEVEL_WEIGHTS[targetLevel] > LEVEL_WEIGHTS[nextLevel]) {
      nextLevel = targetLevel;
    }
  }

  if (nextLevel === undefined || nextLevel === previousLevel || breaches.length === 0) {
    return { nextLevel, nextLevels };
  }

  // 利用側が breaches[0] を代表値として扱えるよう、レベルと超過幅の大きい順に並べる
  breaches.sort(
    (a, b) =>
      LEVEL_WEIGHTS[b.level] - LEVEL_WEIGHTS[a.level] ||
      b.observedBytes - b.thresholdBytes - (a.observedBytes - a.thresholdBytes)
  );

  return {
    nextLevel,
    nextLevels,
    alert: {
      level: nextLevel,
      breaches,
      observedBytes,
      sample,
    },
  };
}
