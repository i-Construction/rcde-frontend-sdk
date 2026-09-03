import chroma from "chroma-js";
import {
  PngBuffer,
  pngParser,
  PointCloud,
  PointCloudColor,
  PointCloudLODLoader,
  PointCloudLODParser,
  PointCloudMeta,
} from "@i-con/pcd-viewer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Euler, Group, Object3D, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { ContractFile } from "../contexts/contractFiles";
import { parsePngBuffer } from "../lib/pngParse";
import { loadTile } from "../lib/tileLoader";
import type { ViewerFileMemoryEstimate } from "../lib/viewerMemory";
import { clamp } from "../lib/viewerMath";
import { CoordinateSystem, type CoordinateSystemType } from "../bridge/viewerBridge";

// 座標系ごとの変換定義
const COORDINATE_SYSTEM_TRANSFORMS: Record<
  CoordinateSystemType,
  {
    rotation: [number, number, number]; // Euler angles [x, y, z] (radians)
    scale: [number, number, number];
  }
> = {
  // 右手系 Z Up → 変換不要
  [CoordinateSystem.RightHandedZUp]: { rotation: [0, 0, 0], scale: [1, 1, 1] },
  // 右手系 Y Up → X軸周りに +90° 回転して Y→Z へ
  [CoordinateSystem.RightHandedYUp]: { rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1] },
  // 右手系 X Up → Y軸周りに -90° 回転して X→Z へ
  [CoordinateSystem.RightHandedXUp]: { rotation: [0, -Math.PI / 2, 0], scale: [1, 1, 1] },
  // 左手系 Z Up → X軸ミラーで右手系に変換
  [CoordinateSystem.LeftHandedZUp]: { rotation: [0, 0, 0], scale: [-1, 1, 1] },
  // 左手系 Y Up → X軸周りに +90° 回転 + X軸ミラー
  [CoordinateSystem.LeftHandedYUp]: { rotation: [Math.PI / 2, 0, 0], scale: [-1, 1, 1] },
  // 左手系 X Up → Y軸周りに -90° 回転 + X軸ミラー
  [CoordinateSystem.LeftHandedXUp]: { rotation: [0, -Math.PI / 2, 0], scale: [-1, 1, 1] },
};

export type ContractFileProps = {
  file: ContractFile;
  meta: PointCloudMeta;
  referencePoint?: Vector3;
  selected?: boolean;
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // degree
  inspectorPointSize?: number;
  inspectorOpacity?: number;
  inspectorCoordinateSystem?: CoordinateSystemType;
  onMemoryEstimateChange?: (estimate: ViewerFileMemoryEstimate) => void;
};

const ContractFileView = ({
  file,
  meta,
  referencePoint,
  selected = false,
  translation,
  rotation,
  inspectorPointSize,
  inspectorOpacity,
  inspectorCoordinateSystem,
  onMemoryEstimateChange,
}: ContractFileProps) => {
  const { client, project } = useClient();
  const [init, setInit] = useState(false);
  const [hasIntensity, setHasIntensity] = useState(false);
  const groupRef = useRef<Group>(null);
  const memoryEstimateFrameRef = useRef<number | null>(null);
  const cacheStateKey = `${file.id ?? "unknown"}-${meta?.version ?? "unknown"}`;
  const cacheStateRef = useRef<{
    key: string;
    pngBufferCache: Map<string, Promise<PngBuffer>>;
    loadedTileMemory: Map<string, { compressedBytes: number; decodedBytes: number }>;
  }>({
    key: cacheStateKey,
    pngBufferCache: new Map(),
    loadedTileMemory: new Map(),
  });
  const fileIdRef = useRef(file.id);
  const onMemoryEstimateChangeRef = useRef(onMemoryEstimateChange);

  // file / meta.version の切り替わりと同じ commit で読み込み側も新しいキャッシュを参照できるよう、
  // 描画中の ref として世代を持つ。破棄される render でも更新され得る pragmatic pattern なので、
  // effect タイミングに戻す際は loader との race に注意すること。
  if (cacheStateRef.current.key !== cacheStateKey) {
    cacheStateRef.current = {
      key: cacheStateKey,
      pngBufferCache: new Map(),
      loadedTileMemory: new Map(),
    };
  }

  // 基準点変更時に parser の参照が変わり PointCloudGrid 側の読み込み処理が
  // 再実行されても、同一ファイル・同一LODタイルであれば取得済みのPNGバッファを
  // 再利用してネットワーク再取得を避けるためのキャッシュ。
  // file / meta が変わった場合のみキャッシュを作り直す。
  const emitMemoryEstimate = useCallback(() => {
    if (file.id === undefined || onMemoryEstimateChange === undefined) {
      return;
    }

    let loadedTileCount = 0;
    let compressedBytes = 0;
    let decodedBytes = 0;
    for (const tile of cacheStateRef.current.loadedTileMemory.values()) {
      loadedTileCount += 1;
      compressedBytes += tile.compressedBytes;
      decodedBytes += tile.decodedBytes;
    }

    onMemoryEstimateChange({
      fileId: file.id,
      loadedTileCount,
      compressedBytes,
      decodedBytes,
      totalBytes: decodedBytes,
    });
  }, [file.id, onMemoryEstimateChange]);

  const scheduleMemoryEstimateFlush = useCallback(() => {
    if (onMemoryEstimateChange === undefined) {
      return;
    }
    if (memoryEstimateFrameRef.current !== null) {
      return;
    }

    memoryEstimateFrameRef.current = window.requestAnimationFrame(() => {
      memoryEstimateFrameRef.current = null;
      emitMemoryEstimate();
    });
  }, [emitMemoryEstimate, onMemoryEstimateChange]);

  const registerTileMemory = useCallback(
    (cacheKey: string, metrics: { compressedBytes: number; decodedBytes: number }) => {
      const previous = cacheStateRef.current.loadedTileMemory.get(cacheKey);
      if (
        previous?.compressedBytes === metrics.compressedBytes &&
        previous?.decodedBytes === metrics.decodedBytes
      ) {
        return;
      }

      cacheStateRef.current.loadedTileMemory.set(cacheKey, metrics);
      scheduleMemoryEstimateFlush();
    },
    [scheduleMemoryEstimateFlush]
  );

  // memoryMonitoring の ON/OFF で onMemoryEstimateChange が切り替わると
  // loader 参照も変わるが、PNG キャッシュは file/meta 単位で保持しているため
  // 同一タイルのネットワーク再取得は避けられる。
  const loader: PointCloudLODLoader<PngBuffer> = useCallback(
    (props) => {
      const pngBufferCache = cacheStateRef.current.pngBufferCache;
      const { address, color } = props;
      const { lod, coordinate } = address;
      const addr = `${coordinate.x}-${coordinate.y}-${coordinate.z}`;
      const cacheKey = `${lod}-${addr}-${color ? "color" : "position"}`;

      const cached = pngBufferCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      const requestProps = {
        contractId: project!.contractId!,
        contractFileId: file.id!,
        level: lod,
        addr,
      };

      const promise = loadTile(
        () => client!.getContractFileImagePosition(requestProps),
        color ? () => client!.getContractFileImageColor(requestProps) : undefined,
        parsePngBuffer
      ).then((result) => {
        registerTileMemory(cacheKey, {
          compressedBytes: result.compressedBytes,
          decodedBytes: result.decodedBytes,
        });
        const buf: PngBuffer = { position: result.position };
        if (result.color) buf.color = result.color;
        return buf;
      });

      pngBufferCache.set(cacheKey, promise);
      promise.catch(() => {
        pngBufferCache.delete(cacheKey);
      });
      return promise;
    },
    [client, project, file, registerTileMemory]
  );

  useEffect(() => {
    fileIdRef.current = file.id;
    onMemoryEstimateChangeRef.current = onMemoryEstimateChange;
  }, [file.id, onMemoryEstimateChange]);

  useEffect(() => {
    emitMemoryEstimate();
  }, [cacheStateKey, emitMemoryEstimate]);

  useEffect(() => {
    (async () => {
      if (meta?.version !== undefined) {
        try {
          // load initial position data and check for intensity
          const {
            position: { data },
          } = await loader({
            address: {
              lod: 0,
              coordinate: {
                x: 0,
                y: 0,
                z: 0,
              },
            },
          });
          const { length } = data;
          const found = Array.from({ length: length / 4 }).some((_, i) => {
            const alpha = data[i * 4 + 3];
            return alpha !== 0 && alpha !== 255;
          });
          setHasIntensity(found);
        } catch (e) {
          console.warn(e);
        }
      }
      setInit(true);
    })();
  }, [meta, loader]);

  useEffect(() => {
    return () => {
      if (memoryEstimateFrameRef.current !== null) {
        window.cancelAnimationFrame(memoryEstimateFrameRef.current);
      }
      cacheStateRef.current.pngBufferCache.clear();
      cacheStateRef.current.loadedTileMemory.clear();
      if (fileIdRef.current !== undefined && onMemoryEstimateChangeRef.current !== undefined) {
        onMemoryEstimateChangeRef.current({
          fileId: fileIdRef.current,
          loadedTileCount: 0,
          compressedBytes: 0,
          decodedBytes: 0,
          totalBytes: 0,
        });
      }
    };
    // cleanup はアンマウント時だけに限定する。依存変更時にキャッシュを破棄しない。
  }, []);

  // Shift metadata considering the reference point
  const shiftedMeta = useMemo(() => {
    if (referencePoint === undefined || referencePoint === null) return meta;
    const { min, max } = meta.bounds;
    const mi = new Vector3().fromArray(min).add(referencePoint);
    const ma = new Vector3().fromArray(max).add(referencePoint);
    return {
      ...meta,
      bounds: {
        min: mi.toArray(),
        max: ma.toArray(),
      },
    };
  }, [meta, referencePoint]);

  const parser: PointCloudLODParser<PngBuffer> = useCallback(
    (e) => {
      const g = referencePoint ?? new Vector3();
      const pts = pngParser(e).map((p) => {
        p.position.add(g);
        return p;
      });
      return pts;
    },
    [referencePoint]
  );

  // Generate a color scale
  const schema = useMemo(() => {
    return chroma.scale("Spectral");
  }, []);

  // Interpolate color based on intensity
  const lerpIntensityColor = useCallback(
    (t: number) => {
      const c = schema(t);
      const [r, g, b] = c.rgb(false);
      return [r / 255, g / 255, b / 255] as [number, number, number];
    },
    [schema]
  );

  // Determine the color of a point
  const pointCloudColor: PointCloudColor = useCallback(
    ({ point }) => {
      const { color: c } = point;
      let baseColor: [number, number, number];

      if (c !== undefined) {
        const { r, g, b, a } = c;
        if (hasIntensity) {
          baseColor = lerpIntensityColor(a / 255);
        } else {
          baseColor = [r / 255, g / 255, b / 255];
        }
      } else {
        baseColor = [1, 1, 1];
      }

      // If selected, blend with blue overlay
      if (selected) {
        const blueColor = [0x21 / 255, 0x96 / 255, 0xf3 / 255] as [number, number, number];
        const blendFactor = 0.3; // 30% blue, 70% original color

        // Linear interpolation (lerp) between base color and blue
        const blendedColor: [number, number, number] = [
          baseColor[0] * (1 - blendFactor) + blueColor[0] * blendFactor,
          baseColor[1] * (1 - blendFactor) + blueColor[1] * blendFactor,
          baseColor[2] * (1 - blendFactor) + blueColor[2] * blendFactor,
        ];
        return blendedColor;
      }

      return baseColor;
    },
    [lerpIntensityColor, hasIntensity, selected]
  );

  const pointSize = useMemo(() => {
    const bb = meta.bounds;
    const x = bb.max[0] - bb.min[0];
    const y = bb.max[1] - bb.min[1];
    const z = bb.max[2] - bb.min[2];
    return getDefaultPointCloudSize({ size: { x, y, z } });
  }, [meta]);

  const minPointSize = useMemo(() => {
    return (pointSize ?? 1) * 1e-1;
  }, [pointSize]);

  // Apply inspector appearance settings to this file's materials
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (inspectorPointSize === undefined && inspectorOpacity === undefined) return;

    group.traverse((obj: Object3D) => {
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

      if (inspectorPointSize !== undefined) {
        const ps = clamp(inspectorPointSize, 0, 5);
        if (typeof mat.size === "number") {
          mat.size = ps;
          mat.needsUpdate = true;
        }
        if (mat.uniforms?.pointSize?.value !== undefined) {
          mat.uniforms.pointSize.value = ps;
        }
      }

      if (inspectorOpacity !== undefined) {
        const opacity01 = clamp(inspectorOpacity, 0, 100) / 100;
        if (mat.uniforms?.opacity?.value !== undefined) {
          mat.uniforms.opacity.value = opacity01;
        }
        if (typeof mat.opacity === "number") {
          mat.opacity = opacity01;
          if (opacity01 < 1 && mat.transparent !== true) mat.transparent = true;
          mat.needsUpdate = true;
        }
      }
    });
  }, [inspectorPointSize, inspectorOpacity]);

  // 座標系に基づく変換を計算
  const csTransform = useMemo(() => {
    if (!inspectorCoordinateSystem) return undefined;
    return COORDINATE_SYSTEM_TRANSFORMS[inspectorCoordinateSystem];
  }, [inspectorCoordinateSystem]);

  // Render the PointCloud if initialization is complete
  // Wrap in group to apply file-specific translation, rotation, and appearance
  // 外側 group: ユーザーが設定した座標・角度
  // 内側 group: 座標系変換（データの座標系 → ビューアの座標系）
  return init ? (
    <group
      ref={groupRef}
      position={[translation.x, translation.y, translation.z]}
      rotation={[
        rotation.x * (Math.PI / 180),
        rotation.y * (Math.PI / 180),
        rotation.z * (Math.PI / 180),
        "XYZ",
      ]}
    >
      <group
        rotation={
          csTransform
            ? new Euler(
                csTransform.rotation[0],
                csTransform.rotation[1],
                csTransform.rotation[2],
                "XYZ"
              )
            : undefined
        }
        scale={csTransform ? csTransform.scale : undefined}
      >
        <PointCloud
          frustumCulled={false}
          meta={shiftedMeta}
          loader={loader}
          parser={parser}
          pointColorHandler={pointCloudColor}
          pointSize={pointSize}
          minPointSize={minPointSize}
        />
      </group>
    </group>
  ) : null;
};

function getDefaultPointCloudSize(props: {
  size: { x: number; y: number; z: number };
  min?: number;
  max?: number;
}): number {
  const { x, y, z } = props.size;
  const { min, max } = props;
  const s = Math.max(x, y, z);
  // CAUTION: default size is based on poisson disk sampling method
  // in pcd-lod module, the maximum # of points in each unit cube is `2 ^ 14`,
  // so radius of the poisson disk is `{side length of the unit} / sqrt(2 ^ 14)`.
  // resulting radius multiplied by 3 is optimal size of the point cloud.
  const ps = (s / 128) * 3;
  return clamp(ps, min ?? ps, max ?? ps);
}

export { ContractFileView };
