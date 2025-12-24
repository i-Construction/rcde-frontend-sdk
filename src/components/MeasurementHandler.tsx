import { useFrame, useThree } from '@react-three/fiber';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BufferGeometry, Matrix4, Points, Scene, Vector3 } from 'three';
import { buildTree, pick } from '../services/Picking';
import { useMouseUVPosition } from '../hooks/useMouseUVPosition';
import { MeasurementView } from './MeasurementView';
import { useReferencePoint } from '../contexts/referencePoint';

export type MeasurementHandlerProps = {
  onChange?: (points: Vector3[]) => void;
  // 外部から制御する測定点（座標編集時に更新）
  externalPoints?: Vector3[];
};

// シーンから点群データを抽出
const extractPointsFromScene = (scene: Scene, sampleRate = 10): Vector3[] => {
  const allPoints: Vector3[] = [];
  let pointsObjectCount = 0;

  scene.traverse((obj) => {
    // デバッグ: オブジェクトタイプを確認（Points関連のみ）
    if (obj.type === 'Points' || obj.type === 'points' || obj instanceof Points) {
      console.log(`[MeasurementHandler] Found Points: type=${obj.type}, instanceof=${obj instanceof Points}, name=${obj.name}`);
    }

    // Points オブジェクト、または type が 'Points' または 'points' のオブジェクトを検索
    if (obj instanceof Points || obj.type === 'Points' || obj.type === 'points') {
      pointsObjectCount++;
      const geometry = (obj as Points).geometry as BufferGeometry;
      const positions = geometry.getAttribute('position');

      if (positions) {
        console.log(`[MeasurementHandler] Points positions count: ${positions.count}`);
        // パフォーマンスのためサンプリング
        for (let i = 0; i < positions.count; i += sampleRate) {
          const point = new Vector3(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );
          // ワールド座標に変換
          point.applyMatrix4(obj.matrixWorld);
          allPoints.push(point);
        }
      } else {
        console.log(`[MeasurementHandler] Points has no position attribute`);
      }
    }
  });

  console.log(`[MeasurementHandler] extractPointsFromScene: found ${pointsObjectCount} Points objects, ${allPoints.length} total points`);
  return allPoints;
};

const MeasurementHandler: FC<MeasurementHandlerProps> = ({ onChange, externalPoints }) => {
  const lastRef = useRef<Vector3 | null>(null);
  const [head, setHead] = useState<Vector3 | null>(null);
  // ローカルstateを使用（R3F Context問題を回避）
  const [points, setPoints] = useState<Vector3[]>([]);
  useReferencePoint(); // コンテキスト接続を維持
  const treeRef = useRef<ReturnType<typeof buildTree>['tree'] | null>(null);
  const pointsRef = useRef<Vector3[]>([]);
  const prevCameraMatrix = useRef<Matrix4>(new Matrix4());

  const { camera, gl, scene } = useThree();
  const canvas = gl.domElement;

  const getUV = useMouseUVPosition({ canvas });

  // MeasurementView に渡す points を決定
  // externalPoints が渡されている場合はそちらを優先
  const displayPoints = useMemo(() => {
    if (externalPoints && externalPoints.length > 0) {
      return externalPoints;
    }
    return head !== null ? [...points, head] : [...points];
  }, [externalPoints, points, head]);

  // カメラが移動したらQuadTreeを再構築
  useFrame(() => {
    // カメラマトリックスが変わった時のみ更新
    if (!prevCameraMatrix.current.equals(camera.matrixWorld)) {
      prevCameraMatrix.current.copy(camera.matrixWorld);

      const scenePoints = extractPointsFromScene(scene);

      if (scenePoints.length > 0) {
        pointsRef.current = scenePoints;
        const result = buildTree({ camera, points: scenePoints });
        treeRef.current = result.tree;
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
        const result = buildTree({ camera, points: scenePoints });
        treeRef.current = result.tree;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [camera, scene]);

  const pickPoint = useCallback(
    (uv: { x: number; y: number }): Vector3 | undefined => {
      if (!treeRef.current || pointsRef.current.length === 0) {
        console.log(`[MeasurementHandler] pickPoint: tree=${!!treeRef.current}, points=${pointsRef.current.length}`);
        return undefined;
      }

      const result = pick(uv, treeRef.current, pointsRef.current);
      // デバッグ（頻度を下げる）
      if (Math.random() < 0.05) {
        console.log(`[MeasurementHandler] pickPoint: uv=(${uv.x.toFixed(3)}, ${uv.y.toFixed(3)}), result=${result ? 'found' : 'undefined'}`);
      }
      return result;
    },
    []
  );

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // 計測モード時は他のハンドラーへの伝播を防ぐ
      e.stopPropagation();

      const last = lastRef.current;
      if (last !== null) {
        const newPoints = [...points, last];
        setPoints(newPoints);
        onChange?.(newPoints);
        lastRef.current = null;

        // 2点選択したらリセット準備（次のクリックで新しい計測開始）
        if (newPoints.length >= 2) {
          // 少し遅延してリセット
          setTimeout(() => {
            setPoints([]);
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
      if (e.key === 'Escape') {
        setPoints([]);
        setHead(null);
        lastRef.current = null;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPoints([]);
      setHead(null);
      lastRef.current = null;
    };

    // clickイベントの伝播を防ぐ（Viewer.ClickHandlerによるファイル選択を防ぐ）
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    // capture: true でイベントを先に捕捉
    canvas.addEventListener('mousedown', handleMouseDown, { capture: true });
    canvas.addEventListener('click', handleClick, { capture: true });
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown, { capture: true });
      canvas.removeEventListener('click', handleClick, { capture: true });
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, [canvas, getUV, pickPoint, points, setPoints, onChange]);

  return (
    <MeasurementView
      edit
      points={displayPoints}
    />
  );
};

export { MeasurementHandler };
