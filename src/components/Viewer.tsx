import { Box } from "@mui/material";
import { GizmoHelper, GizmoViewport, Grid, MapControls } from "@react-three/drei";
import { Canvas, CanvasProps, useThree } from "@react-three/fiber";
import { PointCloudMeta } from "@i-con/pcd-viewer";
import { FC, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box3,
  Color,
  DoubleSide,
  Quaternion,
  Vector2,
  Vector3,
  Group,
  PerspectiveCamera,
  Object3D,
  Raycaster,
  WebGLRenderer,
} from "three";
import { useClient } from "../contexts/client";
import { ContractFile, useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import { isPclodCompleted } from "../lib/contractFileStatus";
import {
  evaluateViewerMemoryAlert,
  type ViewerFileMemoryEstimate,
  type ViewerMemoryAlertLevel,
  type ViewerMemoryMonitoringOptions,
  type ViewerMemorySample,
  type ViewerMemorySource,
} from "../lib/viewerMemory";
import { ContractFileProps, ContractFileView } from "./ContractFileView";
import { ReferencePointAxis } from "./ReferencePointAxis";
import { ReferencePointView } from "./ReferencePointView";

type UpAxis = "Y" | "Z";

type CoordinateSystemType =
  | "RIGHT_HANDED_X_UP"
  | "LEFT_HANDED_X_UP"
  | "RIGHT_HANDED_Y_UP"
  | "LEFT_HANDED_Y_UP"
  | "RIGHT_HANDED_Z_UP"
  | "LEFT_HANDED_Z_UP";

type ViewerTransform = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // degree
  fileId: number; // RCDE DB ID
};
type ViewerAppearance = {
  pointSize: number; // 0..5
  opacity: number; // 0..100
  upAxis?: UpAxis; // カメラUp
  coordinateSystem?: CoordinateSystemType; // ファイル単位の座標系
  fileId?: number; // R-CDEのデータベースに登録されているファイルID
};
type Command =
  | { type: "SET_TRANSFORM"; payload: ViewerTransform }
  | { type: "SET_APPEARANCE"; payload: ViewerAppearance }
  | { type: "RESET" };
const CHANNEL = "RCDE_VIEWER_CMD";

type R3FProps = {
  canvas?: CanvasProps;
  map?: boolean;
  light?: boolean;
  grid?: boolean;
  gizmo?: boolean;
  referencePointAxis?: boolean;
};

type BrowserPerformance = Performance & {
  memory?: {
    usedJSHeapSize?: number;
  };
  measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
};

export type RCDEAppConfig = {
  token: string;
  baseUrl?: string;
  authType?: "2legged" | "3legged";
};

export type ViewerProps = {
  app: RCDEAppConfig;
  constructionId: number;
  contractId: number;
  contractFileIds?: number[];
  r3f?: R3FProps;
  children?: ReactNode;
  positionOffsetComponent?: ReactNode;
  auxiliaryContent?: ReactNode;
  contractFilesRefetchKey?: number;
  selectedFileId?: number;
  onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
  memoryMonitoring?: ViewerMemoryMonitoringOptions;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Helper function to check if a ray intersects with a Box3
const rayIntersectBox = (
  ray: { origin: Vector3; direction: Vector3 },
  box: Box3
): Vector3 | null => {
  const invDir = new Vector3(1 / ray.direction.x, 1 / ray.direction.y, 1 / ray.direction.z);
  const t1 = (box.min.x - ray.origin.x) * invDir.x;
  const t2 = (box.max.x - ray.origin.x) * invDir.x;
  const t3 = (box.min.y - ray.origin.y) * invDir.y;
  const t4 = (box.max.y - ray.origin.y) * invDir.y;
  const t5 = (box.min.z - ray.origin.z) * invDir.z;
  const t6 = (box.max.z - ray.origin.z) * invDir.z;

  const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
  const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

  if (tmax < 0 || tmin > tmax) {
    return null;
  }

  const t = tmin > 0 ? tmin : tmax;
  return ray.origin.clone().add(ray.direction.clone().multiplyScalar(t));
};

// Component to handle click events inside Canvas
const ClickHandler: FC<{
  views: (ContractFileProps & { boundingBox: Box3 })[];
  referencePoint: Vector3;
  onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
}> = ({ views, referencePoint, onContractFileClick }) => {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!onContractFileClick) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new Vector2(x, y), camera);
      const ray = raycaster.ray;

      // Find the closest bounding box that intersects with the ray
      let closestIntersection: {
        view: ContractFileProps & { boundingBox: Box3 };
        distance: number;
      } | null = null;

      for (const view of views) {
        // Apply reference point offset to bounding box
        const offsetBoundingBox = view.boundingBox.clone();
        offsetBoundingBox.translate(referencePoint);

        const intersection = rayIntersectBox(ray, offsetBoundingBox);
        if (intersection) {
          const distance = ray.origin.distanceTo(intersection);
          if (!closestIntersection || distance < closestIntersection.distance) {
            closestIntersection = { view, distance };
          }
        }
      }

      if (closestIntersection) {
        onContractFileClick(closestIntersection.view.file, closestIntersection.view.boundingBox);
      } else {
        onContractFileClick(undefined, undefined);
      }
    },
    [views, referencePoint, onContractFileClick, camera, gl, raycaster]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl, handleClick]);

  return null;
};

const RendererMemoryBridge: FC<{ onRendererReady: (renderer: WebGLRenderer | null) => void }> = ({
  onRendererReady,
}) => {
  const { gl } = useThree();

  useEffect(() => {
    onRendererReady(gl);
    return () => {
      onRendererReady(null);
    };
  }, [gl, onRendererReady]);

  return null;
};

const Viewer: FC<ViewerProps> = (props) => {
  const { load, containers } = useContractFiles();
  const {
    app,
    constructionId,
    contractId,
    contractFileIds,
    r3f,
    children,
    positionOffsetComponent,
    auxiliaryContent,
    contractFilesRefetchKey,
    selectedFileId,
    onContractFileClick,
    memoryMonitoring,
  } = props;
  const { initialize, client, project, setProject } = useClient();
  const { point } = useReferencePoint();
  const [views, setViews] = useState<(ContractFileProps & { boundingBox: Box3 })[]>([]);
  const [fileMemoryEstimates, setFileMemoryEstimates] = useState<
    Record<number, ViewerFileMemoryEstimate>
  >({});

  const transformRootRef = useRef<Group>(null);
  const cameraRef = useRef<PerspectiveCamera>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const memoryMonitoringRef = useRef<ViewerMemoryMonitoringOptions | undefined>(memoryMonitoring);
  const lastSampleAtRef = useRef(0);
  const precisePageBytesMeasuredAtRef = useRef<number | undefined>(undefined);
  const precisePageMeasurementGenerationRef = useRef(0);
  const memoryEstimateSummaryRef = useRef({
    loadedFileCount: 0,
    loadedTileCount: 0,
    compressedBytes: 0,
    decodedBytes: 0,
    estimatedViewerBytes: 0,
  });
  const lastEmittedMemorySampleRef = useRef<ViewerMemorySample | undefined>(undefined);
  const visibleFileIdsRef = useRef<number[]>([]);
  const precisePageBytesRef = useRef<number | undefined>(undefined);
  const precisePageMeasurementInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const memoryAlertLevelRef = useRef<ViewerMemoryAlertLevel | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [appearance, setAppearance] = useState<{ pointSize: number; opacity: number }>({
    pointSize: 2,
    opacity: 100,
  });
  const isMemoryMonitoringEnabled = memoryMonitoring?.enabled === true;
  const memorySampleIntervalMs = Math.max(memoryMonitoring?.sampleIntervalMs ?? 15000, 1000);

  const clearMemoryAlertLevel = useCallback(() => {
    const previousLevel = memoryAlertLevelRef.current;
    const lastSample = lastEmittedMemorySampleRef.current;
    if (previousLevel !== undefined && lastSample !== undefined) {
      memoryMonitoringRef.current?.onAlertLevelChange?.(undefined, lastSample);
    }
    memoryAlertLevelRef.current = undefined;
    lastEmittedMemorySampleRef.current = undefined;
  }, []);

  // File-specific transforms (fileId -> translation + rotation)
  const [fileTransforms, setFileTransforms] = useState<
    Record<
      number,
      {
        translation: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
      }
    >
  >({});

  // File-specific appearances (fileId -> pointSize + opacity + coordinateSystem)
  const [fileAppearances, setFileAppearances] = useState<
    Record<
      number,
      {
        pointSize: number;
        opacity: number;
        coordinateSystem?: CoordinateSystemType;
      }
    >
  >({});

  // Memoize contractFileIds to prevent unnecessary re-renders
  // Use JSON.stringify to compare array contents rather than reference
  const contractFileIdsKey = contractFileIds ? JSON.stringify(contractFileIds) : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedContractFileIds = useMemo(() => contractFileIds, [contractFileIdsKey]);

  useEffect(() => {
    initialize(app);
  }, [app, initialize]);

  useEffect(() => {
    setProject({ constructionId, contractId });
  }, [constructionId, contractId, setProject]);

  const fetchContractFiles = useCallback(async () => {
    if (!client || !contractId) return;

    try {
      const res = await client.getContractFileList({ contractId });
      const contractFiles = res?.contractFiles ?? [];
      load(contractFiles, memoizedContractFileIds);
    } catch (err) {
      console.warn("[Viewer] getContractFileList threw:", err);
      load([], memoizedContractFileIds);
    }
  }, [client, contractId, memoizedContractFileIds, load]);

  useEffect(() => {
    if (client && contractId) {
      fetchContractFiles();
    }
  }, [client, contractId, fetchContractFiles]);

  useEffect(() => {
    if (contractFilesRefetchKey === undefined) {
      return;
    }
    fetchContractFiles();
  }, [contractFilesRefetchKey, fetchContractFiles]);

  const camera = useMemo(
    () => ({
      fov: 40,
      position: new Vector3(1, 2, 1).multiplyScalar(1e2),
      up: new Vector3(0, 0, 1),
      near: 1e-1,
      far: 1e3 * 5,
    }),
    []
  );

  const metadataFetchKey = useMemo(() => {
    return containers
      .filter((container) => container.visible && isPclodCompleted(container.file))
      .map((container) => container.file.id)
      .sort((left, right) => left - right)
      .join(",");
  }, [containers]);

  useEffect(() => {
    if (project === undefined) return;
    if (client === undefined) return;

    const targets = containers.filter(
      (container) => container.visible && isPclodCompleted(container.file)
    );

    if (targets.length === 0) {
      setViews([]);
      return;
    }

    const promises = targets.map((container) => {
      const id = container.file.id;
      return client
        .getContractFileMetadata({ ...project, contractFileId: id })
        .then((d) => {
          const meta = d as unknown as PointCloudMeta;
          const { min, max } = meta.bounds;
          const boundingBox = new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
          return { file: container.file, meta, boundingBox };
        })
        .catch((e) => {
          console.error(e);
          return undefined;
        });
    });

    Promise.all(promises).then((vs) => {
      setViews(vs.filter((v): v is ContractFileProps & { boundingBox: Box3 } => v !== undefined));
    });
    // metadataFetchKey が同じなら contractFilesRefetchKey 由来の containers 参照更新では再取得しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataFetchKey, project, client]);

  const handleFileMemoryEstimateChange = useCallback((estimate: ViewerFileMemoryEstimate) => {
    setFileMemoryEstimates((prev) => {
      const current = prev[estimate.fileId];
      const isZeroEstimate =
        estimate.loadedTileCount === 0 &&
        estimate.compressedBytes === 0 &&
        estimate.decodedBytes === 0 &&
        estimate.totalBytes === 0;

      if (isZeroEstimate) {
        if (current === undefined) {
          return prev;
        }
        const next = { ...prev };
        delete next[estimate.fileId];
        return next;
      }

      if (
        current?.loadedTileCount === estimate.loadedTileCount &&
        current.compressedBytes === estimate.compressedBytes &&
        current.decodedBytes === estimate.decodedBytes &&
        current.totalBytes === estimate.totalBytes
      ) {
        return prev;
      }

      return {
        ...prev,
        [estimate.fileId]: estimate,
      };
    });
  }, []);

  const handleRendererReady = useCallback((renderer: WebGLRenderer | null) => {
    rendererRef.current = renderer;
  }, []);
  const applyAppearanceToScene = useCallback(
    (root: Group | null, ps: number, opPercent: number) => {
      if (!root) return;
      const pointSize = clamp(ps, 0, 5);
      const opacity01 = clamp(opPercent, 0, 100) / 100;

      root.traverse((obj: Object3D) => {
        const mat = (
          obj as {
            material?: {
              size?: number;
              uniforms?: Record<string, { value?: number }>;
              opacity?: number;
              transparent?: boolean;
              needsUpdate?: boolean;
            };
          }
        ).material;
        if (!mat) return;

        if (typeof mat.size === "number") {
          mat.size = pointSize;
          mat.needsUpdate = true;
        }
        if (mat.uniforms) {
          if (mat.uniforms.pointSize?.value !== undefined) mat.uniforms.pointSize.value = pointSize;
          if (mat.uniforms.opacity?.value !== undefined) mat.uniforms.opacity.value = opacity01;
        }
        if (typeof mat.opacity === "number") {
          mat.opacity = opacity01;
          if (opacity01 < 1 && mat.transparent !== true) mat.transparent = true;
          mat.needsUpdate = true;
        }
      });
    },
    []
  );

  const visibleFileIds = useMemo(
    () =>
      views.map((view) => view.file.id).filter((fileId): fileId is number => fileId !== undefined),
    [views]
  );

  const memoryEstimateSummary = useMemo(() => {
    let loadedTileCount = 0;
    let compressedBytes = 0;
    let decodedBytes = 0;

    for (const estimate of Object.values(fileMemoryEstimates)) {
      loadedTileCount += estimate.loadedTileCount;
      compressedBytes += estimate.compressedBytes;
      decodedBytes += estimate.decodedBytes;
    }

    return {
      loadedFileCount: Object.keys(fileMemoryEstimates).length,
      loadedTileCount,
      compressedBytes,
      decodedBytes,
      estimatedViewerBytes: decodedBytes,
    };
  }, [fileMemoryEstimates]);

  const visibleFileIdsKey = useMemo(() => visibleFileIds.join(","), [visibleFileIds]);

  useEffect(() => {
    memoryMonitoringRef.current = memoryMonitoring;
  }, [memoryMonitoring]);

  useEffect(() => {
    memoryEstimateSummaryRef.current = memoryEstimateSummary;
  }, [memoryEstimateSummary]);

  useEffect(() => {
    visibleFileIdsRef.current = visibleFileIds;
  }, [visibleFileIds]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      clearMemoryAlertLevel();
      isMountedRef.current = false;
      rendererRef.current = null;
    };
  }, [clearMemoryAlertLevel]);

  const emitMemorySample = useCallback(
    ({ force = false }: { force?: boolean } = {}) => {
      if (!isMemoryMonitoringEnabled) {
        return;
      }

      const now = Date.now();
      if (!force) {
        if (now - lastSampleAtRef.current < memorySampleIntervalMs) {
          return;
        }
        lastSampleAtRef.current = now;
      }

      const perf = performance as BrowserPerformance;
      const jsHeapBytes =
        typeof perf.memory?.usedJSHeapSize === "number" ? perf.memory.usedJSHeapSize : undefined;
      const pageBytes = precisePageBytesRef.current;
      const pageBytesMeasuredAt = precisePageBytesMeasuredAtRef.current;

      let source: ViewerMemorySource = "estimate";
      if (pageBytes !== undefined) {
        source = "browser-precise";
      } else if (jsHeapBytes !== undefined) {
        source = "js-heap";
      }

      const rendererMemory = rendererRef.current?.info.memory;
      const estimateSummary = memoryEstimateSummaryRef.current;
      const sample: ViewerMemorySample = {
        timestamp: now,
        source,
        estimatedViewerBytes: estimateSummary.estimatedViewerBytes,
        pageBytes,
        pageBytesMeasuredAt,
        jsHeapBytes,
        loadedFileCount: estimateSummary.loadedFileCount,
        loadedTileCount: estimateSummary.loadedTileCount,
        compressedBytes: estimateSummary.compressedBytes,
        decodedBytes: estimateSummary.decodedBytes,
        geometryCount: rendererMemory?.geometries,
        textureCount: rendererMemory?.textures,
        visibleFileIds: visibleFileIdsRef.current,
      };
      lastEmittedMemorySampleRef.current = sample;

      const options = memoryMonitoringRef.current;
      options?.onSample?.(sample);

      const previousLevel = memoryAlertLevelRef.current;
      const { nextLevel, alert } = evaluateViewerMemoryAlert({
        sample,
        thresholds: options?.thresholds,
        previousLevel,
      });
      memoryAlertLevelRef.current = nextLevel;

      if (nextLevel !== previousLevel) {
        options?.onAlertLevelChange?.(nextLevel, sample);
      }

      if (alert !== undefined) {
        options?.onAlert?.(alert);
      }
    },
    [isMemoryMonitoringEnabled, memorySampleIntervalMs]
  );

  const refreshPrecisePageMemory = useCallback(async () => {
    if (!isMemoryMonitoringEnabled || precisePageMeasurementInFlightRef.current) {
      return;
    }

    const generation = precisePageMeasurementGenerationRef.current;
    const perf = performance as BrowserPerformance;
    if (typeof perf.measureUserAgentSpecificMemory !== "function") {
      precisePageBytesRef.current = undefined;
      precisePageBytesMeasuredAtRef.current = undefined;
      return;
    }

    precisePageMeasurementInFlightRef.current = true;
    try {
      const result = await perf.measureUserAgentSpecificMemory();
      if (!isMountedRef.current || generation !== precisePageMeasurementGenerationRef.current) {
        return;
      }
      precisePageBytesRef.current = typeof result.bytes === "number" ? result.bytes : undefined;
      precisePageBytesMeasuredAtRef.current =
        typeof result.bytes === "number" ? Date.now() : undefined;
      emitMemorySample({ force: true });
    } catch {
      if (!isMountedRef.current || generation !== precisePageMeasurementGenerationRef.current) {
        return;
      }
      const hadPrecisePageBytes = precisePageBytesRef.current !== undefined;
      precisePageBytesRef.current = undefined;
      precisePageBytesMeasuredAtRef.current = undefined;
      if (hadPrecisePageBytes) {
        emitMemorySample({ force: true });
      }
    } finally {
      precisePageMeasurementInFlightRef.current = false;
    }
  }, [isMemoryMonitoringEnabled, emitMemorySample]);

  useEffect(() => {
    applyAppearanceToScene(transformRootRef.current, appearance.pointSize, appearance.opacity);
  }, [appearance, applyAppearanceToScene]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      clearMemoryAlertLevel();
      precisePageMeasurementGenerationRef.current += 1;
      precisePageMeasurementInFlightRef.current = false;
      precisePageBytesRef.current = undefined;
      precisePageBytesMeasuredAtRef.current = undefined;
      lastSampleAtRef.current = 0;
      return;
    }

    // 無効化中にアンマウントされたファイルのゴースト推定値を刈り取る。
    // まだ表示中のファイルの推定値は保持し、再有効化直後のサンプルが 0 値にならないようにする。
    // setFileMemoryEstimates は次のコミットまで反映されないため、刈り取り後の集計値を
    // memoryEstimateSummaryRef に同期的に書き込んでから emitMemorySample を呼ぶ。
    const activeFileIds = new Set(visibleFileIdsRef.current);
    const pruned: Record<number, ViewerFileMemoryEstimate> = {};
    for (const [key, value] of Object.entries(fileMemoryEstimates)) {
      if (activeFileIds.has(Number(key))) {
        pruned[Number(key)] = value;
      }
    }
    setFileMemoryEstimates(pruned);

    let prunedTileCount = 0;
    let prunedCompressedBytes = 0;
    let prunedDecodedBytes = 0;
    for (const estimate of Object.values(pruned)) {
      prunedTileCount += estimate.loadedTileCount;
      prunedCompressedBytes += estimate.compressedBytes;
      prunedDecodedBytes += estimate.decodedBytes;
    }
    memoryEstimateSummaryRef.current = {
      loadedFileCount: Object.keys(pruned).length,
      loadedTileCount: prunedTileCount,
      compressedBytes: prunedCompressedBytes,
      decodedBytes: prunedDecodedBytes,
      estimatedViewerBytes: prunedDecodedBytes,
    };

    emitMemorySample();
    void refreshPrecisePageMemory();
    // fileMemoryEstimates を closure で参照するが、estimates 変化で再実行すると
    // 無限ループになるため依存配列には含めない（トグル時のみ実行する意図）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMemoryMonitoringEnabled, clearMemoryAlertLevel, emitMemorySample, refreshPrecisePageMemory]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      return;
    }

    const timerId = window.setInterval(() => {
      emitMemorySample();
      void refreshPrecisePageMemory();
    }, memorySampleIntervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    isMemoryMonitoringEnabled,
    memorySampleIntervalMs,
    emitMemorySample,
    refreshPrecisePageMemory,
  ]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      return;
    }

    emitMemorySample();
  }, [
    isMemoryMonitoringEnabled,
    emitMemorySample,
    memoryEstimateSummary.loadedFileCount,
    memoryEstimateSummary.loadedTileCount,
    memoryEstimateSummary.compressedBytes,
    memoryEstimateSummary.decodedBytes,
    memoryEstimateSummary.estimatedViewerBytes,
    visibleFileIdsKey,
  ]);

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (!e?.data || e.data.channel !== CHANNEL) return;
      const cmd = e.data.cmd as Command;

      if (cmd.type === "SET_TRANSFORM") {
        const { fileId, translation, rotation } = cmd.payload;
        // Store file-specific transform (translation + rotation)
        setFileTransforms((prev) => ({
          ...prev,
          [fileId]: {
            translation,
            rotation,
          },
        }));
      } else if (cmd.type === "SET_APPEARANCE") {
        const up = cmd.payload.upAxis;
        const cs = cmd.payload.coordinateSystem;
        const nextPointSize = clamp(cmd.payload.pointSize ?? appearance.pointSize, 0, 5);
        const nextOpacity = clamp(cmd.payload.opacity ?? appearance.opacity, 0, 100);

        // fileId が指定されている場合はファイル単位で保存
        const fileId = cmd.payload.fileId;
        if (fileId !== undefined) {
          setFileAppearances((prev) => ({
            ...prev,
            [fileId]: {
              pointSize: nextPointSize,
              opacity: nextOpacity,
              coordinateSystem: cs ?? prev[fileId]?.coordinateSystem,
            },
          }));
        } else {
          // fileId がない場合はグローバル（後方互換）
          setAppearance({ pointSize: nextPointSize, opacity: nextOpacity });
        }

        // upAxis は後方互換のためカメラレベルで適用
        if (up) {
          const cam = cameraRef.current;
          if (cam) {
            if (up === "Y") cam.up.set(0, 1, 0);
            else cam.up.set(0, 0, 1);
            cam.updateProjectionMatrix?.();
          }
          controlsRef.current?.update?.();
        }
      } else if (cmd.type === "RESET") {
        const g = transformRootRef.current;
        if (g) {
          g.position.set(0, 0, 0);
          g.rotation.set(0, 0, 0, "XYZ");
        }
        setAppearance({ pointSize: 2, opacity: 100 });
        setFileAppearances({});
        setFileTransforms({});

        const cam = cameraRef.current;
        if (cam) {
          cam.up.set(0, 0, 1);
          cam.updateProjectionMatrix?.();
        }
        controlsRef.current?.update?.();
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [appearance.pointSize, appearance.opacity]);

  return (
    <Box width={1} height={1} display="flex">
      <Box width={1} height={1} flex={1} position="relative" overflow="hidden">
        <Canvas camera={camera} {...r3f?.canvas}>
          <RendererMemoryBridge onRendererReady={handleRendererReady} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <perspectiveCamera ref={cameraRef as any} />
          {r3f?.map !== false && <MapControls ref={controlsRef} makeDefault screenSpacePanning />}
          {r3f?.light !== false && <ambientLight intensity={0.5} />}
          {r3f?.grid !== false && (
            <Grid
              args={[10, 10]}
              quaternion={new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)}
              infiniteGrid
              followCamera
              fadeDistance={1e3}
              cellSize={1e1}
              sectionSize={1e1 * 5}
              sectionColor={new Color("#6f6f6f")}
              side={DoubleSide}
            />
          )}
          {r3f?.gizmo !== false && (
            <GizmoHelper alignment="top-right" margin={[80, 80]}>
              <GizmoViewport axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]} labelColor="white" />
            </GizmoHelper>
          )}

          <group ref={transformRootRef}>
            {views.map((view) => {
              const fId = view.file.id;
              const transform = fId !== undefined ? fileTransforms[fId] : undefined;
              const fileAppearance = fId !== undefined ? fileAppearances[fId] : undefined;
              return (
                <ContractFileView
                  key={fId}
                  file={view.file}
                  meta={view.meta}
                  referencePoint={point}
                  selected={fId === selectedFileId}
                  translation={transform?.translation ?? { x: 0, y: 0, z: 0 }}
                  rotation={transform?.rotation ?? { x: 0, y: 0, z: 0 }}
                  inspectorPointSize={fileAppearance?.pointSize}
                  inspectorOpacity={fileAppearance?.opacity}
                  inspectorCoordinateSystem={fileAppearance?.coordinateSystem}
                  onMemoryEstimateChange={
                    isMemoryMonitoringEnabled ? handleFileMemoryEstimateChange : undefined
                  }
                />
              );
            })}
            {r3f?.referencePointAxis !== false && (
              <ReferencePointAxis length={10} width={0.2} visible />
            )}
            <group position={point}>{positionOffsetComponent}</group>
            <group>{children}</group>
            {onContractFileClick && (
              <ClickHandler
                views={views}
                referencePoint={point}
                onContractFileClick={onContractFileClick}
              />
            )}
          </group>
        </Canvas>

        <Box
          component="div"
          sx={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ReferencePointView point={point} />
        </Box>
      </Box>
      {auxiliaryContent}
    </Box>
  );
};

export { Viewer };
