"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Vector3 } from "three";
import { toast } from "sonner";
import type {
  PendingUpload,
  PendingUploads,
  ReferencePointAxisProps,
  ViewerMemoryAlert,
  ViewerMemoryAlertLevel,
  ViewerMemoryMonitoringOptions,
  ViewerMemorySample,
  ViewerMemoryThreshold,
  ViewerMemoryThresholds,
  ViewerMemoryThresholdTarget,
} from "@i-con/frontend-sdk";
import { MEBIBYTE, formatBytes } from "@/lib/format";

/** Viewer の `r3f` prop に渡す表示フラグ。 */
export type R3FFlags = {
  map: boolean;
  light: boolean;
  grid: boolean;
  gizmo: boolean;
  /** Viewer 内蔵の基準点軸。自前で描画するため既定で false。 */
  referencePointAxis: boolean;
};

/**
 * 自前で描画する `ReferencePointAxis` の設定。
 *
 * `ReferencePointAxisProps` から必要な 3 つだけを取り出し、UI 側では常に値を持つので
 * `Required` で省略不可にしている。`point` は deprecated なので含めない。
 */
export type AxisConfig = Required<Pick<ReferencePointAxisProps, "visible" | "length" | "width">>;

/**
 * `ViewerMemoryThreshold` を MiB 単位で編集するための、監視対象 1 つ分の設定。
 *
 * `enabled` を OFF にすると `thresholds` からその対象ごと外れ、SDK 側では判定されない。
 */
export type MemoryTargetConfig = {
  enabled: boolean;
  warningMiB: number;
  criticalMiB: number;
  /** 閾値を下回ったと判定するまでの戻り幅（ヒステリシス）。 */
  hysteresisMiB: number;
};

/**
 * `ViewerMemoryThresholds` を MiB 単位で編集するための設定。
 *
 * SDK の閾値は estimate / jsHeap / page の 3 値それぞれに独立して設定する形なので、
 * UI 側の設定も対象ごとに持つ。
 */
export type MemoryConfig = {
  enabled: boolean;
  sampleIntervalMs: number;
  /** 閾値を渡すかどうか。`thresholds` 自体を省略すると監視はサンプル収集だけになる。 */
  thresholdsEnabled: boolean;
  targets: Record<ViewerMemoryThresholdTarget, MemoryTargetConfig>;
};

export type EventLogEntry = {
  id: number;
  at: number;
  /** クリック / ホバー / Bridge コマンド / 情報 の分類 */
  kind: "click" | "hover" | "bridge" | "info";
  label: string;
  detail?: string;
};

type WorkspaceContextValue = {
  // --- 対象プロジェクト ---
  constructionId: number | undefined;
  contractId: number | undefined;
  setProject: (constructionId: number, contractId: number) => void;

  // --- ファイル選択・再取得 ---
  selectedFileId: number | undefined;
  setSelectedFileId: (fileId: number | undefined) => void;
  /** Viewer の `contractFilesRefetchKey` に渡す値 */
  refetchKey: number;
  requestRefetch: () => void;

  // --- アップロード中ファイル（参照を安定させて useContractFileActions に渡す） ---
  pendingUploads: PendingUploads;
  addPendingUpload: (contractFileId: number, name: string) => void;
  removePendingUpload: (contractFileId: number) => void;

  // --- R3F 表示設定 ---
  r3fFlags: R3FFlags;
  toggleR3FFlag: (key: keyof R3FFlags) => void;
  axisConfig: AxisConfig;
  setAxisConfig: (config: AxisConfig) => void;

  // --- ツール ---
  /**
   * 計測モード。SDK の `MeasurementHandler` は自前の Context を持たず、
   * マウントされている間だけキャンバスの入力を奪う作りなので、ON/OFF はここで持つ。
   */
  measurementEnabled: boolean;
  setMeasurementEnabled: (enabled: boolean) => void;
  /** `MeasurementHandler` の `onChange` で確定した計測点。 */
  measurementPoints: Vector3[];
  setMeasurementPoints: (points: Vector3[]) => void;
  customLayerVisible: boolean;
  setCustomLayerVisible: (visible: boolean) => void;
  customFileLayerFileId: number | undefined;
  setCustomFileLayerFileId: (fileId: number | undefined) => void;

  // --- メモリ監視 ---
  memoryConfig: MemoryConfig;
  setMemoryConfig: (config: MemoryConfig) => void;
  /** Viewer / RCDE の `memoryMonitoring` prop に渡すオプション */
  memoryMonitoring: ViewerMemoryMonitoringOptions;
  lastSample: ViewerMemorySample | undefined;
  lastAlert: ViewerMemoryAlert | undefined;
  alertLevel: ViewerMemoryAlertLevel | undefined;

  // --- イベントログ ---
  events: EventLogEntry[];
  pushEvent: (entry: Omit<EventLogEntry, "id" | "at">) => void;
  clearEvents: () => void;
};

const MAX_EVENTS = 60;

/**
 * 3 値は測る範囲が違う（Viewer 推定 < JS ヒープ < ページ全体）ため、既定の閾値も桁を分ける。
 * `sampleIntervalMs` は SDK の既定値と同じ 10 秒。
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  enabled: false,
  sampleIntervalMs: 10000,
  thresholdsEnabled: true,
  targets: {
    estimate: { enabled: true, warningMiB: 256, criticalMiB: 384, hysteresisMiB: 32 },
    jsHeap: { enabled: true, warningMiB: 512, criticalMiB: 768, hysteresisMiB: 32 },
    page: { enabled: true, warningMiB: 1024, criticalMiB: 1536, hysteresisMiB: 32 },
  },
};

/** `ViewerMemoryThresholdTarget` の 3 値に対応する日本語ラベル。 */
export const MEMORY_TARGET_LABELS: Record<ViewerMemoryThresholdTarget, string> = {
  estimate: "Viewer 推定値（estimatedViewerBytes）",
  jsHeap: "JS ヒープ（jsHeapBytes）",
  page: "ページ全体（pageBytes）",
};

/** 表示順を固定するための対象一覧。 */
export const MEMORY_TARGETS: ViewerMemoryThresholdTarget[] = ["estimate", "jsHeap", "page"];

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({
  children,
  initialConstructionId,
  initialContractId,
}: {
  children: ReactNode;
  initialConstructionId?: number;
  initialContractId?: number;
}) {
  const [constructionId, setConstructionId] = useState<number | undefined>(initialConstructionId);
  const [contractId, setContractId] = useState<number | undefined>(initialContractId);
  const [selectedFileId, setSelectedFileId] = useState<number | undefined>(undefined);
  const [refetchKey, setRefetchKey] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<PendingUploads>({});
  const [r3fFlags, setR3FFlags] = useState<R3FFlags>({
    map: true,
    light: true,
    grid: true,
    gizmo: true,
    referencePointAxis: false,
  });
  const [axisConfig, setAxisConfig] = useState<AxisConfig>({
    visible: true,
    length: 10,
    width: 0.2,
  });
  const [measurementEnabled, setMeasurementEnabled] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<Vector3[]>([]);
  const [customLayerVisible, setCustomLayerVisible] = useState(true);
  const [customFileLayerFileId, setCustomFileLayerFileId] = useState<number | undefined>(undefined);
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>(DEFAULT_MEMORY_CONFIG);
  const [lastSample, setLastSample] = useState<ViewerMemorySample | undefined>(undefined);
  const [lastAlert, setLastAlert] = useState<ViewerMemoryAlert | undefined>(undefined);
  const [alertLevel, setAlertLevel] = useState<ViewerMemoryAlertLevel | undefined>(undefined);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const eventIdRef = useRef(0);

  const setProject = useCallback((nextConstructionId: number, nextContractId: number) => {
    setConstructionId(nextConstructionId);
    setContractId(nextContractId);
    setSelectedFileId(undefined);
    setCustomFileLayerFileId(undefined);
    setMeasurementPoints([]);
  }, []);

  const requestRefetch = useCallback(() => {
    setRefetchKey((key) => key + 1);
  }, []);

  const addPendingUpload = useCallback((contractFileId: number, name: string) => {
    // `PendingUploads` は `Record<number, PendingUpload>`。鍵はアップロード API が
    // `onContractFileCreated` で返す contractFileId。
    const entry: PendingUpload = { name };
    setPendingUploads((prev) => ({ ...prev, [contractFileId]: entry }));
  }, []);

  const removePendingUpload = useCallback((contractFileId: number) => {
    setPendingUploads((prev) => {
      if (prev[contractFileId] === undefined) {
        return prev;
      }
      const next = { ...prev };
      delete next[contractFileId];
      return next;
    });
  }, []);

  const toggleR3FFlag = useCallback((key: keyof R3FFlags) => {
    setR3FFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const pushEvent = useCallback((entry: Omit<EventLogEntry, "id" | "at">) => {
    eventIdRef.current += 1;
    const next: EventLogEntry = { ...entry, id: eventIdRef.current, at: Date.now() };
    setEvents((prev) => [next, ...prev].slice(0, MAX_EVENTS));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // ViewerMemoryMonitoringOptions を組み立てる。
  // thresholds を省略すると SDK は onSample だけを呼び、アラート判定を行わない。
  const memoryMonitoring = useMemo<ViewerMemoryMonitoringOptions>(() => {
    // 対象ごとに ON/OFF できるので、OFF の対象はキーごと落として SDK に渡す。
    // すべて OFF なら空オブジェクトになり、判定対象なしとして扱われる。
    const thresholds: ViewerMemoryThresholds | undefined = memoryConfig.thresholdsEnabled
      ? MEMORY_TARGETS.reduce<ViewerMemoryThresholds>((acc, target) => {
          const targetConfig = memoryConfig.targets[target];
          if (targetConfig.enabled) {
            const threshold: ViewerMemoryThreshold = {
              warningBytes: targetConfig.warningMiB * MEBIBYTE,
              criticalBytes: targetConfig.criticalMiB * MEBIBYTE,
              hysteresisBytes: targetConfig.hysteresisMiB * MEBIBYTE,
            };
            acc[target] = threshold;
          }
          return acc;
        }, {})
      : undefined;

    return {
      enabled: memoryConfig.enabled,
      sampleIntervalMs: memoryConfig.sampleIntervalMs,
      thresholds,
      onSample: (sample) => {
        setLastSample(sample);
      },
      onAlert: (alert) => {
        setLastAlert(alert);
        const message = alert.breaches
          .map(
            (breach) =>
              `${MEMORY_TARGET_LABELS[breach.target]} ${formatBytes(
                breach.observedBytes
              )}（閾値 ${formatBytes(breach.thresholdBytes)}）`
          )
          .join(" / ");
        if (alert.level === "critical") {
          toast.error(`メモリ危険域: ${message}`);
        } else {
          toast.warning(`メモリ警告: ${message}`);
        }
      },
      onAlertLevelChange: (level) => {
        setAlertLevel(level);
        if (level === undefined) {
          setLastAlert(undefined);
          toast.success("メモリ使用量が閾値を下回りました");
        }
      },
    };
  }, [memoryConfig]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      constructionId,
      contractId,
      setProject,
      selectedFileId,
      setSelectedFileId,
      refetchKey,
      requestRefetch,
      pendingUploads,
      addPendingUpload,
      removePendingUpload,
      r3fFlags,
      toggleR3FFlag,
      axisConfig,
      setAxisConfig,
      measurementEnabled,
      setMeasurementEnabled,
      measurementPoints,
      setMeasurementPoints,
      customLayerVisible,
      setCustomLayerVisible,
      customFileLayerFileId,
      setCustomFileLayerFileId,
      memoryConfig,
      setMemoryConfig,
      memoryMonitoring,
      lastSample,
      lastAlert,
      alertLevel,
      events,
      pushEvent,
      clearEvents,
    }),
    [
      constructionId,
      contractId,
      setProject,
      selectedFileId,
      refetchKey,
      requestRefetch,
      pendingUploads,
      addPendingUpload,
      removePendingUpload,
      r3fFlags,
      toggleR3FFlag,
      axisConfig,
      measurementEnabled,
      measurementPoints,
      customLayerVisible,
      customFileLayerFileId,
      memoryConfig,
      memoryMonitoring,
      lastSample,
      lastAlert,
      alertLevel,
      events,
      pushEvent,
      clearEvents,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace は WorkspaceProvider の配下で使用してください");
  }
  return context;
}
