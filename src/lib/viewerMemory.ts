export type ViewerMemorySource = "estimate" | "js-heap" | "browser-precise";

export type ViewerMemoryThresholdSource = "estimate" | "js-heap" | "page" | "max-available";

export type ViewerMemoryAlertLevel = "warning" | "critical";

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
  jsHeapBytes?: number;
  loadedFileCount: number;
  loadedTileCount: number;
  compressedBytes: number;
  decodedBytes: number;
  geometryCount?: number;
  textureCount?: number;
  visibleFileIds: number[];
};

export type ViewerMemoryThresholds = {
  warningBytes?: number;
  criticalBytes?: number;
  source?: ViewerMemoryThresholdSource;
  hysteresisBytes?: number;
};

export type ViewerMemoryAlert = {
  level: ViewerMemoryAlertLevel;
  thresholdBytes: number;
  observedBytes: number;
  sample: ViewerMemorySample;
};

export type ViewerMemoryMonitoringOptions = {
  enabled?: boolean;
  sampleIntervalMs?: number;
  thresholds?: ViewerMemoryThresholds;
  onSample?: (sample: ViewerMemorySample) => void;
  onAlert?: (alert: ViewerMemoryAlert) => void;
};

type EvaluateViewerMemoryAlertArgs = {
  sample: ViewerMemorySample;
  thresholds?: ViewerMemoryThresholds;
  previousLevel?: ViewerMemoryAlertLevel;
};

type EvaluateViewerMemoryAlertResult = {
  nextLevel?: ViewerMemoryAlertLevel;
  alert?: ViewerMemoryAlert;
};

const DEFAULT_HYSTERESIS_BYTES = 32 * 1024 * 1024;

export function resolveViewerMemoryObservedBytes(
  sample: ViewerMemorySample,
  source: ViewerMemoryThresholdSource = "max-available"
): number | undefined {
  switch (source) {
    case "estimate":
      return sample.estimatedViewerBytes;
    case "js-heap":
      return sample.jsHeapBytes;
    case "page":
      return sample.pageBytes;
    case "max-available":
      return Math.max(sample.pageBytes ?? 0, sample.jsHeapBytes ?? 0, sample.estimatedViewerBytes);
  }
}

export function evaluateViewerMemoryAlert({
  sample,
  thresholds,
  previousLevel,
}: EvaluateViewerMemoryAlertArgs): EvaluateViewerMemoryAlertResult {
  if (!thresholds) {
    return { nextLevel: undefined };
  }

  const observedBytes = resolveViewerMemoryObservedBytes(sample, thresholds.source);
  if (observedBytes === undefined) {
    return { nextLevel: undefined };
  }

  const warningBytes = thresholds.warningBytes;
  const criticalBytes = thresholds.criticalBytes;
  const hysteresisBytes = thresholds.hysteresisBytes ?? DEFAULT_HYSTERESIS_BYTES;

  let nextLevel: ViewerMemoryAlertLevel | undefined;

  if (criticalBytes !== undefined && observedBytes >= criticalBytes) {
    nextLevel = "critical";
  } else if (warningBytes !== undefined && observedBytes >= warningBytes) {
    nextLevel = "warning";
  } else if (previousLevel === "critical" && criticalBytes !== undefined) {
    nextLevel =
      observedBytes >= Math.max(0, criticalBytes - hysteresisBytes) ? "critical" : undefined;
  } else if (previousLevel === "warning" && warningBytes !== undefined) {
    nextLevel =
      observedBytes >= Math.max(0, warningBytes - hysteresisBytes) ? "warning" : undefined;
  }

  if (nextLevel === undefined || nextLevel === previousLevel) {
    return { nextLevel };
  }

  const thresholdBytes = nextLevel === "critical" ? criticalBytes : warningBytes;
  if (thresholdBytes === undefined) {
    return { nextLevel };
  }

  return {
    nextLevel,
    alert: {
      level: nextLevel,
      thresholdBytes,
      observedBytes,
      sample,
    },
  };
}
