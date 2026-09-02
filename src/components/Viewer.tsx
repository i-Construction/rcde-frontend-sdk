import { Box } from "@mui/material";
import { GizmoHelper, GizmoViewport, Grid, MapControls } from "@react-three/drei";
import { Canvas, CanvasProps, useThree } from "@react-three/fiber";
import { PointCloudMeta } from "@i-con/pcd-viewer";
import {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import type { RCDEClient } from "../lib/rcde-client";
import { ContractFile, useContractFiles } from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";
import { isPclodCompleted } from "../lib/contractFileStatus";
import { computeMetadataFetchPlan } from "../lib/metadataFetchPlan";
import {
  evaluateViewerMemoryAlert,
  type ViewerFileMemoryEstimate,
  type ViewerMemoryAlertLevel,
  type ViewerMemoryMonitoringOptions,
  type ViewerMemorySample,
  type ViewerMemorySource,
} from "../lib/viewerMemory";
import { raycastViews } from "../lib/viewerRaycast";
import { ViewerBridge, type CoordinateSystemType } from "../bridge/viewerBridge";
import type { RCDEAppConfig } from "../types/viewerConfig";
import { ContractFileProps, ContractFileView } from "./ContractFileView";
import { ReferencePointAxis } from "./ReferencePointAxis";
import { ReferencePointView } from "./ReferencePointView";

/**
 * 3D ビューア上のクリックイベント。
 *
 * - `hit: true` — オブジェクト（ContractFile のバウンディングボックス）がクリックされた。
 * - `hit: false` — 空白がクリックされた（選択解除に利用可能）。
 *
 * ### 座標系
 * - `boundingBox` はメタデータの生座標（基準点オフセット未適用）。`onContractFileClick` と同一。
 * - `intersectionPoint` は基準点オフセット適用済みのワールド座標。
 * - `localIntersectionPoint` は基準点オフセット未適用の座標。`boundingBox` と同じ座標系。
 * - `screenPosition` はビューポート座標（`MouseEvent.clientX/clientY`）。
 *   キャンバス相対座標が必要な場合は `canvas.getBoundingClientRect()` で変換してください。
 *
 * ### 制限事項
 * `RCDE_VIEWER_CMD` (`SET_TRANSFORM`) によるファイル個別の translation / rotation は
 * 当たり判定に反映されません。移動・回転されたファイルの判定は元の位置の boundingBox に
 * 基づきます。この制限は `onContractFileClick` と同一です。
 */
export type ViewerClickEvent =
  | {
      hit: true;
      file: ContractFile;
      boundingBox: Box3;
      /** 基準点オフセット適用済みのワールド座標 */
      intersectionPoint: Vector3;
      /** 基準点オフセット未適用の座標（boundingBox と同じ座標系） */
      localIntersectionPoint: Vector3;
      /** ビューポート座標（clientX/clientY） */
      screenPosition: { x: number; y: number };
    }
  | {
      hit: false;
      /** ビューポート座標（clientX/clientY） */
      screenPosition: { x: number; y: number };
    };

/**
 * 3D ビューア上のホバーイベント（enter/leave セマンティクス）。
 *
 * ホバー対象のオブジェクトが**変わったとき**のみ発火します。
 * 同一オブジェクト上でカーソルが移動しても `screenPosition` は更新されません。
 * カーソル追従が必要な場合は、利用側で別途 `mousemove` をリスンしてください。
 *
 * - `hit: true` — オブジェクトにカーソルが入った。
 * - `hit: false` — カーソルがオブジェクトから外れた、またはキャンバス外に出た。
 *
 * ### 座標系
 * - `boundingBox` はメタデータの生座標（基準点オフセット未適用）。
 * - `screenPosition` はビューポート座標（`MouseEvent.clientX/clientY`）。
 *
 * ### 制限事項
 * `RCDE_VIEWER_CMD` (`SET_TRANSFORM`) によるファイル個別の translation / rotation は
 * 当たり判定に反映されません。この制限は `onContractFileClick` と同一です。
 */
export type ViewerHoverEvent =
  | {
      hit: true;
      file: ContractFile;
      boundingBox: Box3;
      /** ビューポート座標（clientX/clientY） */
      screenPosition: { x: number; y: number };
    }
  | {
      hit: false;
    };

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

export type { RCDEAppConfig } from "../types/viewerConfig";

export type ViewerProps = {
  app: RCDEAppConfig;
  constructionId: number;
  contractId: number;
  /**
   * 初回ロード時に表示するファイルの ID。省略すると全ファイルを表示する。
   *
   * 適用されるのは初回ロード時（contractId を切り替えた直後のロードを含む）のみで、
   * 以降にこの prop を差し替えても表示状態は変わらない。ロード後の表示・非表示は
   * ユーザーの切り替え操作を優先し、contractFilesRefetchKey による再取得でも保たれる。
   */
  contractFileIds?: number[];
  r3f?: R3FProps;
  children?: ReactNode;
  positionOffsetComponent?: ReactNode;
  auxiliaryContent?: ReactNode;
  contractFilesRefetchKey?: number;
  selectedFileId?: number;
  onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
  onObjectClick?: (event: ViewerClickEvent) => void;
  onObjectHover?: (event: ViewerHoverEvent) => void;
  memoryMonitoring?: ViewerMemoryMonitoringOptions;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const ClickHandler: FC<{
  views: (ContractFileProps & { boundingBox: Box3 })[];
  referencePoint: Vector3;
  onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
  onObjectClick?: (event: ViewerClickEvent) => void;
}> = ({ views, referencePoint, onContractFileClick, onObjectClick }) => {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);

  const viewsRef = useRef(views);
  const referencePointRef = useRef(referencePoint);
  const cameraRef = useRef(camera);
  const onContractFileClickRef = useRef(onContractFileClick);
  const onObjectClickRef = useRef(onObjectClick);

  useLayoutEffect(() => {
    viewsRef.current = views;
    referencePointRef.current = referencePoint;
    cameraRef.current = camera;
    onContractFileClickRef.current = onContractFileClick;
    onObjectClickRef.current = onObjectClick;
  });

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!onContractFileClickRef.current && !onObjectClickRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const hit = raycastViews(
        new Vector2(x, y),
        cameraRef.current,
        raycaster,
        viewsRef.current,
        referencePointRef.current
      );

      if (hit) {
        onContractFileClickRef.current?.(hit.view.file, hit.view.boundingBox);
        onObjectClickRef.current?.({
          hit: true,
          file: hit.view.file,
          boundingBox: hit.view.boundingBox,
          intersectionPoint: hit.intersectionPoint,
          localIntersectionPoint: hit.intersectionPoint.clone().sub(referencePointRef.current),
          screenPosition: { x: event.clientX, y: event.clientY },
        });
      } else {
        onContractFileClickRef.current?.(undefined, undefined);
        onObjectClickRef.current?.({
          hit: false,
          screenPosition: { x: event.clientX, y: event.clientY },
        });
      }
    },
    [gl, raycaster]
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

const HOVER_THROTTLE_MS = 50;

const HoverHandler: FC<{
  views: (ContractFileProps & { boundingBox: Box3 })[];
  referencePoint: Vector3;
  onObjectHover: (event: ViewerHoverEvent) => void;
}> = ({ views, referencePoint, onObjectHover }) => {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const lastHoveredFileIdRef = useRef<number | undefined>(undefined);
  const throttleTimerRef = useRef<number | null>(null);
  const pendingEventRef = useRef<MouseEvent | null>(null);
  const onObjectHoverRef = useRef(onObjectHover);
  const viewsRef = useRef(views);
  const referencePointRef = useRef(referencePoint);
  const cameraRef = useRef(camera);

  useLayoutEffect(() => {
    onObjectHoverRef.current = onObjectHover;
    viewsRef.current = views;
    referencePointRef.current = referencePoint;
    cameraRef.current = camera;
  });

  const processEvent = useCallback(
    (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const hit = raycastViews(
        new Vector2(x, y),
        cameraRef.current,
        raycaster,
        viewsRef.current,
        referencePointRef.current
      );
      const fileId = hit?.view.file.id;

      if (fileId === lastHoveredFileIdRef.current) return;
      lastHoveredFileIdRef.current = fileId;

      if (hit) {
        onObjectHoverRef.current({
          hit: true,
          file: hit.view.file,
          boundingBox: hit.view.boundingBox,
          screenPosition: { x: event.clientX, y: event.clientY },
        });
      } else {
        onObjectHoverRef.current({ hit: false });
      }
    },
    [gl, raycaster]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      pendingEventRef.current = event;

      if (throttleTimerRef.current !== null) return;

      processEvent(event);
      pendingEventRef.current = null;

      throttleTimerRef.current = window.setTimeout(() => {
        throttleTimerRef.current = null;
        const pending = pendingEventRef.current;
        if (pending) {
          pendingEventRef.current = null;
          processEvent(pending);
        }
      }, HOVER_THROTTLE_MS);
    },
    [processEvent]
  );

  const emitLeave = useCallback(() => {
    if (lastHoveredFileIdRef.current !== undefined) {
      lastHoveredFileIdRef.current = undefined;
      onObjectHoverRef.current({ hit: false });
    }
  }, []);

  useEffect(() => {
    const id = lastHoveredFileIdRef.current;
    if (id !== undefined && !views.some((v) => v.file.id === id)) {
      emitLeave();
    }
  }, [views, emitLeave]);

  // リスナー登録: gl のみに依存し、views / referencePoint の変化で再登録しない
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onLeave = () => {
      if (throttleTimerRef.current !== null) {
        window.clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      pendingEventRef.current = null;
      emitLeave();
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [gl, handleMouseMove, emitLeave]);

  // アンマウント時のみ: タイマ解除 + leave 通知
  useEffect(
    () => () => {
      if (throttleTimerRef.current !== null) {
        window.clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      pendingEventRef.current = null;
      emitLeave();
    },
    [emitLeave]
  );

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

type MemoryEstimateSummary = {
  loadedFileCount: number;
  loadedTileCount: number;
  compressedBytes: number;
  decodedBytes: number;
  estimatedViewerBytes: number;
};

function summarizeMemoryEstimates(
  estimates: Record<number, ViewerFileMemoryEstimate>
): MemoryEstimateSummary {
  let loadedTileCount = 0;
  let compressedBytes = 0;
  let decodedBytes = 0;

  for (const estimate of Object.values(estimates)) {
    loadedTileCount += estimate.loadedTileCount;
    compressedBytes += estimate.compressedBytes;
    decodedBytes += estimate.decodedBytes;
  }

  return {
    loadedFileCount: Object.keys(estimates).length,
    loadedTileCount,
    compressedBytes,
    decodedBytes,
    estimatedViewerBytes: decodedBytes,
  };
}

const Viewer: FC<ViewerProps> = (props) => {
  const { load, updateFiles, containers } = useContractFiles();
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
    onObjectClick,
    onObjectHover,
    memoryMonitoring,
  } = props;
  const { initialize, client, project, setProject } = useClient();
  const { point } = useReferencePoint();
  const [views, setViews] = useState<(ContractFileProps & { boundingBox: Box3 })[]>([]);
  const [fileMemoryEstimates, setFileMemoryEstimates] = useState<
    Record<number, ViewerFileMemoryEstimate>
  >({});

  const metaCacheRef = useRef<
    Map<number, { meta: PointCloudMeta; boundingBox: Box3; batchId?: number }>
  >(new Map());
  const metaCacheProjectKeyRef = useRef<string>("");
  const metaCacheClientRef = useRef<RCDEClient | undefined>(undefined);

  const transformRootRef = useRef<Group>(null);
  const cameraRef = useRef<PerspectiveCamera>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const memoryMonitoringRef = useRef<ViewerMemoryMonitoringOptions | undefined>(memoryMonitoring);
  const activeMonitoringRef = useRef<ViewerMemoryMonitoringOptions | undefined>(
    memoryMonitoring?.enabled === true ? memoryMonitoring : undefined
  );
  const lastSampleAtRef = useRef(0);
  const precisePageBytesMeasuredAtRef = useRef<number | undefined>(undefined);
  const precisePageMeasurementGenerationRef = useRef(0);
  const fileMemoryEstimatesRef = useRef<Record<number, ViewerFileMemoryEstimate>>({});
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
  const emitMemorySampleRef = useRef<(opts?: { force?: boolean }) => void>(() => {});
  const refreshPrecisePageMemoryRef = useRef<() => Promise<void>>(async () => {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [appearance, setAppearance] = useState<{ pointSize: number; opacity: number }>({
    pointSize: 2,
    opacity: 100,
  });
  // コマンドリスナーは購読し直さずに最新の外観を読む必要があるため ref に持つ。
  // 書き手は下のコマンドハンドラだけで、初期値はここで state から取る。
  const appearanceRef = useRef(appearance);
  const isMemoryMonitoringEnabled = memoryMonitoring?.enabled === true;
  const memorySampleIntervalMs = Math.max(memoryMonitoring?.sampleIntervalMs ?? 15000, 1000);

  const clearMemoryAlertLevel = useCallback(() => {
    const previousLevel = memoryAlertLevelRef.current;
    const lastSample = lastEmittedMemorySampleRef.current;
    if (previousLevel !== undefined && lastSample !== undefined) {
      const handler =
        memoryMonitoringRef.current?.onAlertLevelChange ??
        activeMonitoringRef.current?.onAlertLevelChange;
      handler?.(undefined, lastSample);
      activeMonitoringRef.current = undefined;
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

  // contractFileIds は初回ロードのときだけ使う。fetchContractFiles の deps に載せると、
  // 呼び出し側が prop を差し替えるたびに identity が変わって再取得が走る一方、
  // 初回ロード済みの契約では新しい ID 一覧が捨てられ、リクエストだけが無駄に飛ぶ。
  // そのため deps には載せず、最新値を ref 経由で読む。
  const contractFileIdsRef = useRef(contractFileIds);
  useLayoutEffect(() => {
    contractFileIdsRef.current = contractFileIds;
  });

  useEffect(() => {
    initialize(app);
  }, [app, initialize]);

  useEffect(() => {
    setProject({ constructionId, contractId });
  }, [constructionId, contractId, setProject]);

  // 初回ロードが済んだ契約 ID。contractFilesRefetchKey は「初回は undefined で渡す」使い方と
  // 「最初から数値を渡す」使い方の両方があり得るため、キーの値からは初回かどうかを判定できない。
  // 実際に load したかどうかを契約 ID で覚えて判定する。
  //
  // 更新するのは応答が成功した時点なので、契約 A → B と切り替えて B のロードが終わる前に A へ戻すと、
  // ref は A のままで A が初回ロード扱いにならず、contractFileIds が再適用されない。
  // ただし B の一覧は一度も入っていないので A の表示状態が続くだけで破綻はしない。
  // contractId の変化で ref を undefined へ戻す手もあるが、切り替えの最中に一覧が空へ落ちる。
  // そのため、この食い違いは直さずに許容する。
  const loadedContractIdRef = useRef<number | undefined>(undefined);

  // 一覧取得は世代番号で新しい要求だけを採用する。isInitialLoad は await の前に決まる一方
  // loadedContractIdRef の更新は await の後なので、先の要求が飛んでいる最中に次の要求が
  // 始まると両方が初回ロード扱いになり、後着した古い応答がユーザーの表示切り替えを巻き戻す。
  // 契約を切り替えた直後に前の契約の応答が後着する場合も同じ経路で防ぐ。
  const contractFilesRequestGenerationRef = useRef(0);

  const fetchContractFiles = useCallback(async () => {
    if (!client || !contractId) return;

    const isInitialLoad = loadedContractIdRef.current !== contractId;
    // 可視ポリシーも要求を出した時点の値で固定する。await の後に ref を読むと、応答を待つ間に
    // 呼び出し側が prop を差し替えたときに完了時点の値が初回ロードへ適用され、
    // ViewerProps.contractFileIds の「初回ロード時のみ効く」という説明と食い違う。
    const visibleIds = contractFileIdsRef.current;
    const generation = ++contractFilesRequestGenerationRef.current;
    try {
      const res = await client.getContractFileList({ contractId });
      if (generation !== contractFilesRequestGenerationRef.current) return;
      const contractFiles = res?.contractFiles ?? [];
      if (isInitialLoad) {
        load(contractFiles, visibleIds);
        loadedContractIdRef.current = contractId;
      } else {
        // 再取得では contractFileIds から作り直さず、ユーザーが切り替えた表示状態を引き継ぐ
        updateFiles(contractFiles);
      }
    } catch (err) {
      if (generation !== contractFilesRequestGenerationRef.current) return;
      console.warn("[Viewer] getContractFileList threw:", err);
      // 取得失敗と 0 件は区別できないので、再取得の失敗では既存の表示を壊さず前回の一覧を残す。
      // 初回だけは空にする。別の契約へ切り替えた直後に失敗したとき、
      // 前の契約のファイルを出し続けてしまうため。
      if (isInitialLoad) {
        load([], visibleIds);
      }
    }
  }, [client, contractId, load, updateFiles]);

  // 初回と contractFilesRefetchKey 由来の再取得を 1 本の effect にまとめる。
  // 分けていたときは、呼び出し側が最初から数値のキーを渡すとマウント時に 2 本とも発火していた。
  // client / contractId の未設定は fetchContractFiles 側で早期 return する。
  useEffect(() => {
    fetchContractFiles();
  }, [fetchContractFiles, contractFilesRefetchKey]);

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
      .map((container) => `${container.file.id}:${container.file.batchProcessingResult?.id ?? ""}`)
      .sort()
      .join(",");
  }, [containers]);

  useEffect(() => {
    if (project === undefined) return;
    if (client === undefined) return;

    const targets = containers.filter(
      (container) => container.visible && isPclodCompleted(container.file)
    );

    if (targets.length === 0) {
      metaCacheRef.current.clear();
      metaCacheProjectKeyRef.current = "";
      metaCacheClientRef.current = undefined;
      setViews([]);
      return;
    }

    // project / client が切り替わったらキャッシュを破棄して全件再取得する
    const projectKey = `${project.constructionId}:${project.contractId}`;
    if (metaCacheProjectKeyRef.current !== projectKey || metaCacheClientRef.current !== client) {
      metaCacheRef.current.clear();
      metaCacheProjectKeyRef.current = projectKey;
      metaCacheClientRef.current = client;
    }

    // pclod 再生成でバッチ ID が変わったエントリを破棄する
    for (const target of targets) {
      const id = target.file.id;
      if (id === undefined) continue;
      const cached = metaCacheRef.current.get(id);
      if (cached && cached.batchId !== target.file.batchProcessingResult?.id) {
        metaCacheRef.current.delete(id);
      }
    }

    const targetIds = targets.map((c) => c.file.id).filter((id): id is number => id !== undefined);
    const { toFetch: toFetchIds, toRemove } = computeMetadataFetchPlan(
      targetIds,
      new Set(metaCacheRef.current.keys())
    );

    for (const id of toRemove) {
      metaCacheRef.current.delete(id);
    }

    const toFetchIdSet = new Set(toFetchIds);
    const toFetch = targets.filter((c) => c.file.id !== undefined && toFetchIdSet.has(c.file.id));

    const buildViews = () => {
      const nextViews = targets
        .map((container) => {
          const id = container.file.id;
          if (id === undefined) return undefined;
          const cached = metaCacheRef.current.get(id);
          if (!cached) return undefined;
          return { file: container.file, meta: cached.meta, boundingBox: cached.boundingBox };
        })
        .filter((v): v is ContractFileProps & { boundingBox: Box3 } => v !== undefined);
      setViews(nextViews);
    };

    if (toFetch.length === 0) {
      buildViews();
      return;
    }

    let cancelled = false;

    const promises = toFetch.map((container) => {
      const id = container.file.id!;
      const batchId = container.file.batchProcessingResult?.id;
      return client
        .getContractFileMetadata({ ...project, contractFileId: id })
        .then((d) => {
          if (cancelled) return;
          const meta = d as unknown as PointCloudMeta;
          const { min, max } = meta.bounds;
          const boundingBox = new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
          metaCacheRef.current.set(id, { meta, boundingBox, batchId });
        })
        .catch((e) => {
          console.error(e);
        });
    });

    Promise.all(promises).then(() => {
      if (cancelled) return;
      buildViews();
    });

    return () => {
      cancelled = true;
    };
    // metadataFetchKey が同じなら contractFilesRefetchKey 由来の containers 参照更新では再取得しない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataFetchKey, project, client]);

  // deps を空に保つこと。identity が変わると handleFileMemoryEstimateChange → loader まで
  // 伝播し、点群ロード経路が再走する。
  const commitFileMemoryEstimates = useCallback(
    (next: Record<number, ViewerFileMemoryEstimate>) => {
      fileMemoryEstimatesRef.current = next;
      memoryEstimateSummaryRef.current = summarizeMemoryEstimates(next);
      setFileMemoryEstimates(next);
    },
    []
  );

  const handleFileMemoryEstimateChange = useCallback(
    (estimate: ViewerFileMemoryEstimate) => {
      const prev = fileMemoryEstimatesRef.current;
      const current = prev[estimate.fileId];
      const isZeroEstimate =
        estimate.loadedTileCount === 0 &&
        estimate.compressedBytes === 0 &&
        estimate.decodedBytes === 0 &&
        estimate.totalBytes === 0;

      if (isZeroEstimate) {
        if (current === undefined) {
          return;
        }
        const next = { ...prev };
        delete next[estimate.fileId];
        commitFileMemoryEstimates(next);
        return;
      }

      if (
        current?.loadedTileCount === estimate.loadedTileCount &&
        current.compressedBytes === estimate.compressedBytes &&
        current.decodedBytes === estimate.decodedBytes &&
        current.totalBytes === estimate.totalBytes
      ) {
        return;
      }

      const next = {
        ...prev,
        [estimate.fileId]: estimate,
      };
      commitFileMemoryEstimates(next);
    },
    [commitFileMemoryEstimates]
  );

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

  const visibleFileIdsKey = useMemo(() => visibleFileIds.join(","), [visibleFileIds]);

  // この effect は有効化 effect（下方）より宣言順が前でなければならない。
  // 無効化コミットでは有効化 effect 本体の clearMemoryAlertLevel が activeMonitoringRef を
  // 読むため、その時点で最新化されている必要がある。
  useEffect(() => {
    memoryMonitoringRef.current = memoryMonitoring;
    if (memoryMonitoring?.enabled === true) {
      activeMonitoringRef.current = memoryMonitoring;
    }
  }, [memoryMonitoring]);

  // emitMemorySample とゴースト刈り取り effect が読むため、有効化 effect より前に同期する。
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
      if (memoryMonitoringRef.current?.enabled !== true) {
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
        visibleFileIds: [...visibleFileIdsRef.current],
      };
      lastEmittedMemorySampleRef.current = sample;

      const options = memoryMonitoringRef.current;
      try {
        options?.onSample?.(sample);
      } catch {
        // 利用側コールバックの例外は監視ラインに波及させない
      }

      const previousLevel = memoryAlertLevelRef.current;
      const { nextLevel, alert } = evaluateViewerMemoryAlert({
        sample,
        thresholds: options?.thresholds,
        previousLevel,
      });
      memoryAlertLevelRef.current = nextLevel;

      if (nextLevel !== previousLevel) {
        try {
          options?.onAlertLevelChange?.(nextLevel, sample);
        } catch {
          // 利用側コールバックの例外は監視ラインに波及させない
        }
      }

      if (alert !== undefined) {
        try {
          options?.onAlert?.(alert);
        } catch {
          // 利用側コールバックの例外は監視ラインに波及させない
        }
      }
    },
    [memorySampleIntervalMs]
  );

  const refreshPrecisePageMemory = useCallback(async () => {
    if (
      memoryMonitoringRef.current?.enabled !== true ||
      precisePageMeasurementInFlightRef.current
    ) {
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
    let shouldEmit = false;
    try {
      const result = await perf.measureUserAgentSpecificMemory();
      if (!isMountedRef.current || generation !== precisePageMeasurementGenerationRef.current) {
        return;
      }
      precisePageBytesRef.current = typeof result.bytes === "number" ? result.bytes : undefined;
      precisePageBytesMeasuredAtRef.current =
        typeof result.bytes === "number" ? Date.now() : undefined;
      shouldEmit = true;
    } catch {
      if (!isMountedRef.current || generation !== precisePageMeasurementGenerationRef.current) {
        return;
      }
      shouldEmit = precisePageBytesRef.current !== undefined;
      precisePageBytesRef.current = undefined;
      precisePageBytesMeasuredAtRef.current = undefined;
    } finally {
      precisePageMeasurementInFlightRef.current = false;
    }
    if (shouldEmit) {
      emitMemorySample({ force: true });
    }
  }, [emitMemorySample]);

  // 毎コミットで最新の関数参照を ref に同期。宣言順が後続の有効化 effect / interval effect
  // よりも前であるため、初回コミットでも noop を掴まない。
  useEffect(() => {
    emitMemorySampleRef.current = emitMemorySample;
    refreshPrecisePageMemoryRef.current = refreshPrecisePageMemory;
  });

  useEffect(() => {
    applyAppearanceToScene(transformRootRef.current, appearance.pointSize, appearance.opacity);
  }, [appearance, applyAppearanceToScene]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      clearMemoryAlertLevel();
      activeMonitoringRef.current = undefined;
      precisePageMeasurementGenerationRef.current += 1;
      precisePageMeasurementInFlightRef.current = false;
      precisePageBytesRef.current = undefined;
      precisePageBytesMeasuredAtRef.current = undefined;
      lastSampleAtRef.current = 0;
      return;
    }

    // 無効化中にアンマウントされたファイルのゴースト推定値を刈り取る。
    // まだ表示中のファイルの推定値は保持し、再有効化直後のサンプルが 0 値にならないようにする。
    // fileMemoryEstimatesRef から読むことで、同一バッチで子が通知した最新値を失わない。
    const activeFileIds = new Set(visibleFileIdsRef.current);
    const current = fileMemoryEstimatesRef.current;
    const currentKeys = Object.keys(current);
    let changed = false;
    const pruned: Record<number, ViewerFileMemoryEstimate> = {};
    for (const key of currentKeys) {
      if (activeFileIds.has(Number(key))) {
        pruned[Number(key)] = current[Number(key)];
      } else {
        changed = true;
      }
    }

    if (changed) {
      commitFileMemoryEstimates(pruned);
    }

    emitMemorySampleRef.current();
    // 内部バグの保険。利用側コールバック例外は emitMemorySample 内で握る。
    refreshPrecisePageMemoryRef.current().catch(() => {});
  }, [isMemoryMonitoringEnabled, clearMemoryAlertLevel, commitFileMemoryEstimates]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      return;
    }

    const timerId = window.setInterval(() => {
      emitMemorySampleRef.current();
      // 内部バグの保険。利用側コールバック例外は emitMemorySample 内で握る。
      refreshPrecisePageMemoryRef.current().catch(() => {});
    }, memorySampleIntervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isMemoryMonitoringEnabled, memorySampleIntervalMs]);

  useEffect(() => {
    if (!isMemoryMonitoringEnabled) {
      return;
    }

    emitMemorySampleRef.current();
  }, [isMemoryMonitoringEnabled, fileMemoryEstimates, visibleFileIdsKey]);

  useEffect(() => {
    return ViewerBridge.addListener((cmd) => {
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
        const nextPointSize = clamp(cmd.payload.pointSize ?? appearanceRef.current.pointSize, 0, 5);
        const nextOpacity = clamp(cmd.payload.opacity ?? appearanceRef.current.opacity, 0, 100);

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
          // postMessage はタスクごとに配送されるため、再レンダーを待つと
          // 直後のコマンドが古い値をフォールバックに使う。ref を先に更新する。
          const nextAppearance = { pointSize: nextPointSize, opacity: nextOpacity };
          appearanceRef.current = nextAppearance;
          setAppearance(nextAppearance);
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
        const resetAppearance = { pointSize: 2, opacity: 100 };
        appearanceRef.current = resetAppearance;
        setAppearance(resetAppearance);
        setFileAppearances({});
        setFileTransforms({});

        const cam = cameraRef.current;
        if (cam) {
          cam.up.set(0, 0, 1);
          cam.updateProjectionMatrix?.();
        }
        controlsRef.current?.update?.();
      }
    });
  }, []);

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
            {(onContractFileClick || onObjectClick) && (
              <ClickHandler
                views={views}
                referencePoint={point}
                onContractFileClick={onContractFileClick}
                onObjectClick={onObjectClick}
              />
            )}
            {onObjectHover && (
              <HoverHandler views={views} referencePoint={point} onObjectHover={onObjectHover} />
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
