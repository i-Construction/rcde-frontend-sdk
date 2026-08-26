import { useFrame, useThree } from "@react-three/fiber";
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BufferGeometry, Matrix4, Points, Scene, Vector3 } from "three";
import { buildTree, pick } from "../services/Picking";
import { useMouseUVPosition } from "../hooks/useMouseUVPosition";
import { MeasurementView } from "./MeasurementView";
import { useReferencePoint } from "../contexts/referencePoint";
import { useMeasurementOptional } from "../contexts/measurement";
import { RCDE_CLICK_HANDLED } from "./Viewer";

export type MeasurementHandlerProps = {
  onChange?: (points: Vector3[]) => void;
  // 外部から制御する測定点（座標編集時に更新）
  externalAppEditedPoints?: Vector3[];
  /**
   * 計測モードの有効/無効。`false` のときイベントを遮断せず、
   * ClickHandler や実装者のリスナーが正常に動作する。
   * @default true
   */
  isActive?: boolean;
};

// シーンから点群データを抽出
const extractPointsFromScene = (scene: Scene, sampleRate = 10): Vector3[] => {
  const allPoints: Vector3[] = [];

  scene.traverse((obj) => {
    // Points オブジェクト、または type が 'Points' または 'points' のオブジェクトを検索
    if (obj instanceof Points || obj.type === "Points" || obj.type === "points") {
      const geometry = (obj as Points).geometry as BufferGeometry;
      const positions = geometry.getAttribute("position");

      if (positions) {
        // パフォーマンスのためサンプリング
        for (let i = 0; i < positions.count; i += sampleRate) {
          const point = new Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
          // ワールド座標に変換
          point.applyMatrix4(obj.matrixWorld);
          allPoints.push(point);
        }
      }
    }
  });

  return allPoints;
};

const MeasurementHandler: FC<MeasurementHandlerProps> = ({
  onChange,
  externalAppEditedPoints,
  isActive: isActiveProp,
}) => {
  const lastRef = useRef<Vector3 | null>(null);
  const [head, setHead] = useState<Vector3 | null>(null);

  // MeasurementContext が存在すればそちらを使い、なければローカル state にフォールバック
  const ctx = useMeasurementOptional();
  const [localPoints, setLocalPoints] = useState<Vector3[]>([]);
  const points = ctx ? ctx.points : localPoints;
  const setPoints = ctx ? ctx.setPoints : setLocalPoints;

  // isActive: props が明示的に渡されていればそちらを使い、なければ常に有効
  const isActive = isActiveProp ?? true;

  // ref で最新値を保持し、イベントリスナーの再登録を防ぐ
  const measurementPointsRef = useRef(points);
  const setPointsRef = useRef(setPoints);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    measurementPointsRef.current = points;
    setPointsRef.current = setPoints;
    onChangeRef.current = onChange;
  });

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useReferencePoint(); // コンテキスト接続を維持
  const treeRef = useRef<ReturnType<typeof buildTree>["tree"] | null>(null);
  const pointsRef = useRef<Vector3[]>([]);
  const prevCameraMatrix = useRef<Matrix4>(new Matrix4());

  const { camera, gl, scene } = useThree();
  const canvas = gl.domElement;

  const getUV = useMouseUVPosition({ canvas });

  // MeasurementView に渡す points を決定
  // externalAppEditedPoints が渡されている場合はそちらを優先
  const displayPoints = useMemo(() => {
    if (externalAppEditedPoints && externalAppEditedPoints.length > 0) {
      return externalAppEditedPoints;
    }
    return head !== null ? [...points, head] : [...points];
  }, [externalAppEditedPoints, points, head]);

  // カメラが移動したらQuadTreeを再構築
  useFrame(() => {
    // カメラマトリックスが変わった時のみ更新
    if (!prevCameraMatrix.current.equals(camera.matrixWorld)) {
      prevCameraMatrix.current.copy(camera.matrixWorld);

      const scenePoints = extractPointsFromScene(scene);

      if (scenePoints.length > 0) {
        pointsRef.current = scenePoints;
        const buildTreeResult = buildTree({ camera, points: scenePoints });
        treeRef.current = buildTreeResult.tree;
      }
    }
  });

  // 初回のQuadTree構築
  useEffect(() => {
    // 少し遅延してシーンがロードされるのを待つ
    const timer = setTimeout(() => {
      const scenePoints = extractPointsFromScene(scene);

      if (scenePoints.length > 0) {
        pointsRef.current = scenePoints;
        const buildTreeResult = buildTree({ camera, points: scenePoints });
        treeRef.current = buildTreeResult.tree;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [camera, scene]);

  const pickPoint = useCallback((uv: { x: number; y: number }): Vector3 | undefined => {
    if (!treeRef.current || pointsRef.current.length === 0) {
      return undefined;
    }

    const pickedPoint = pick(uv, treeRef.current, pointsRef.current);
    return pickedPoint;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.stopPropagation();

      const last = lastRef.current;
      if (last !== null) {
        const currentPoints = measurementPointsRef.current;
        const newPoints = [...currentPoints, last];
        setPointsRef.current(newPoints);
        onChangeRef.current?.(newPoints);
        lastRef.current = null;

        if (newPoints.length >= 2) {
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = setTimeout(() => {
            resetTimerRef.current = null;
            setPointsRef.current([]);
          }, 2000);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const uv = getUV(e);
      const world = pickPoint({ x: uv.x, y: uv.y });
      if (world !== undefined) {
        lastRef.current = world;
        setHead(world);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPointsRef.current([]);
        setHead(null);
        lastRef.current = null;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPointsRef.current([]);
      setHead(null);
      lastRef.current = null;
    };

    const handleClick = (e: MouseEvent) => {
      (e as unknown as Record<string, boolean>)[RCDE_CLICK_HANDLED] = true;
    };

    canvas.addEventListener("mousedown", handleMouseDown, { capture: true });
    canvas.addEventListener("click", handleClick, { capture: true });
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("contextmenu", handleContextMenu, { capture: true });

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      canvas.removeEventListener("mousedown", handleMouseDown, { capture: true });
      canvas.removeEventListener("click", handleClick, { capture: true });
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, [isActive, canvas, getUV, pickPoint]);

  return isActive ? <MeasurementView edit points={displayPoints} /> : null;
};

export { MeasurementHandler };
