import chroma from "chroma-js";
import {
  PngBuffer,
  pngParser,
  PointCloud,
  PointCloudColor,
  PointCloudLODLoader,
  PointCloudLODParser,
  PointCloudMeta,
} from "pcd-viewer";
import { PNG } from "pngjs/browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { ContractFile } from "../contexts/contractFiles";
import { CoordinateSystemType } from "../bridge/viewerBridge";
import { getCoordinateTransformMatrix } from "../utils/coordinateSystem";

export type ContractFileProps = {
  file: ContractFile;
  meta: PointCloudMeta;
  referencePoint?: Vector3;
  selected?: boolean;
  transform?: {
    translation: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
  appearance?: {
    pointSize: number;
    opacity: number;
    coordinateSystem: CoordinateSystemType;
  };
};

const ContractFileView = ({
  file,
  meta,
  referencePoint,
  selected = false,
  transform,
  appearance,
}: ContractFileProps) => {
  const { client, project } = useClient();
  const [init, setInit] = useState(false);
  const [hasIntensity, setHasIntensity] = useState(false);
  const groupRef = useRef<Group>(null);

  // Groupにtransformを適用
  useEffect(() => {
    if (!transform || !groupRef.current) return;
    const { translation, rotation } = transform;
    groupRef.current.position.set(translation.x, translation.y, translation.z);
    const toRad = Math.PI / 180;
    groupRef.current.rotation.set(
      rotation.x * toRad,
      rotation.y * toRad,
      rotation.z * toRad,
      'XYZ'
    );
  }, [transform]);

  // 座標系に応じた変換行列を計算
  const coordinateTransformMatrix = useMemo(() => {
    if (!appearance?.coordinateSystem) return null;
    return getCoordinateTransformMatrix(appearance.coordinateSystem);
  }, [appearance?.coordinateSystem]);

  const loader: PointCloudLODLoader<PngBuffer> = useCallback(
    (props) => {
      const { address, color } = props;
      const { lod, coordinate } = address;
      // Construct the URL of the PNG file from the address
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        const png = new PNG();
        const addr = `${coordinate.x}-${coordinate.y}-${coordinate.z}`;
        const props = {
          contractId: project!.contractId!,
          contractFileId: file.id!,
          level: lod,
          addr,
        };
        // Fetch position data
        const pBuffer = await client?.getContractFileImagePosition(props);
        if (pBuffer === undefined) {
          reject(new Error("Failed to load PNG buffer"));
          return;
        }
        const pParsed = png.parse(pBuffer);
        pParsed.on("parsed", async () => {
          if (color) {
            // Fetch color data
            const cBuffer = await client?.getContractFileImageColor(props);
            if (cBuffer === undefined) {
              reject(new Error("Failed to load PNG buffer"));
              return;
            }
            const png2 = new PNG();
            const cParsed = png2.parse(cBuffer);
            cParsed.on("parsed", () => {
              resolve({
                position: pParsed,
                color: cParsed,
              });
            });
          } else {
            resolve({
              position: pParsed,
            });
          }
        });
      });
    },
    [client, project, file]
  );

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

  // Shift metadata considering the reference point
  const shiftedMeta = useMemo(() => {
    if (referencePoint === undefined) return meta;
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
    // appearanceが指定されている場合はそちらを使用
    if (appearance?.pointSize !== undefined) {
      return appearance.pointSize;
    }
    const bb = meta.bounds;
    const x = bb.max[0] - bb.min[0];
    const y = bb.max[1] - bb.min[1];
    const z = bb.max[2] - bb.min[2];
    return getDefaultPointCloudSize({ size: { x, y, z } });
  }, [meta, appearance?.pointSize]);

  const minPointSize = useMemo(() => {
    return (pointSize ?? 1) * 1e-1;
  }, [pointSize]);

  // Render the PointCloud if initialization is complete
  return init ? (
    <group ref={groupRef}>
      {coordinateTransformMatrix && <primitive object={coordinateTransformMatrix} />}
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
  return Math.min(Math.max(min ?? ps, ps), max ?? ps);
}

export { ContractFileView };
