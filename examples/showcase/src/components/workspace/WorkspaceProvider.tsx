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
  ViewerMemoryThresholds,
  ViewerMemoryThresholdSource,
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
 * `ViewerMemoryThresholds` を MiB 単位で編集するための設定。
 *
 * SDK の閾値は「複数対象を同時に監視する」形ではなく、`source` で選んだ 1 つの観測値に
 * 対して warning / critical を判定する形になっている。そのため設定もフラットに持つ。
 */
export type MemoryConfig = {
  enabled: boolean;
  sampleIntervalMs: number;
  /** 閾値を渡すかどうか。`thresholds` 自体を省略すると監視はサンプル収集だけになる。 */
  thresholdsEnabled: boolean;
  /** 閾値と比較する観測値の選び方。 */
  source: ViewerMemoryThresholdSource;
  warningMiB: number;
  criticalMiB: number;
  /** 閾値を下回ったと判定するまでの戻り幅（ヒステリシス）。 */
  hysteresisMiB: number;
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

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  enabled: false,
  sampleIntervalMs: 10000,
  thresholdsEnabled: true,
  source: "max-available",
  warningMiB: 512,
  criticalMiB: 768,
  hysteresisMiB: 32,
};

/** `ViewerMemoryThresholdSource` の 4 値に対応する日本語ラベル。 */
export const MEMORY_SOURCE_LABELS: Record<ViewerMemoryThresholdSource, string> = {
  estimate: "Viewer 推定値（estimatedViewerBytes）",
  "js-heap": "JS ヒープ（jsHeapBytes）",
  page: "ページ全体（pageBytes）",
  "max-available": "取得できた値の最大（既定）",
};

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
    const thresholds: ViewerMemoryThresholds | undefined = memoryConfig.thresholdsEnabled
      ? {
          source: memoryConfig.source,
          warningBytes: memoryConfig.warningMiB * MEBIBYTE,
          criticalBytes: memoryConfig.criticalMiB * MEBIBYTE,
          hysteresisBytes: memoryConfig.hysteresisMiB * MEBIBYTE,
        }
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
        const message = `${MEMORY_SOURCE_LABELS[memoryConfig.source]} が閾値を超過（${formatBytes(
          alert.observedBytes
        )} / 閾値 ${formatBytes(alert.thresholdBytes)}）`;
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
