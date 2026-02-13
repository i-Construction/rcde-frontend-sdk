import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Matrix4, Vector2, Vector3 } from 'three';
import { RAD2DEG } from 'three/src/math/MathUtils.js';

type MeasurementViewProps = {
  points?: Vector3[];
  referencePoint?: Vector3;
  edit?: boolean;
};

const getViewMetricPoints = (
  div: HTMLDivElement,
  camera: Camera,
  point: Vector3
): Vector3 => {
  const { width, height } = div.getBoundingClientRect();
  const projection = point.clone().project(camera);
  const screenPos = new Vector3(((projection.x + 1) / 2) * width, (-(projection.y - 1) / 2) * height, 0);
  return screenPos;
};

const MeasurementView: FC<MeasurementViewProps> = ({
  points,
  referencePoint,
  edit,
}) => {
  const { camera } = useThree();
  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  const [editMetricPoints, setEditMetricPoints] = useState<Vector3[]>([]);
  const [metrics, setMetrics] = useState<
    {
      from: Vector3;
      to: Vector3;
      length: number;
    }[]
  >([]);
  const prev = useRef<Matrix4>(new Matrix4());
  const prevPtsLength = useRef(0);
  const prevPointsHash = useRef<string>('');

  const memoCachedPoints = useMemo(() => {
    if (points !== undefined) {
      return points;
    }
    return [];
  }, [points]);

  const offset = useMemo(() => {
    return referencePoint !== undefined ? referencePoint : new Vector3();
  }, [referencePoint]);

  const updateMetrics = useCallback(
    (camera: Camera) => {
      const transformedPoints = memoCachedPoints.map((memoCachedPoint) => {
        return memoCachedPoint.clone().add(offset);
      });

      if (div === null || transformedPoints.length < 1) return [];

      const viewPoints = transformedPoints.map((point) => {
        const viewPoint = getViewMetricPoints(div, camera, point);
        return viewPoint;
      });

      if (edit) {
        setEditMetricPoints(viewPoints);
      }

      const viewMetrics = Array.from(Array(viewPoints.length - 1).keys()).map(
        (i) => {
          const p0 = transformedPoints[i];
          const p1 = transformedPoints[i + 1];
          const length = p0.distanceTo(p1);
          return {
            from: viewPoints[i],
            to: viewPoints[i + 1],
            length,
          };
        }
      );
      setMetrics(viewMetrics);
    },
    [div, edit, offset, memoCachedPoints]
  );

  // 点群が変更されたときにも更新
  useEffect(() => {
    if (div !== null && memoCachedPoints.length > 0) {
      updateMetrics(camera);
    }
  }, [memoCachedPoints, div, camera, updateMetrics]);

  useFrame(({ camera: camera }) => {
    const ptsChanged = prevPtsLength.current !== memoCachedPoints.length;

    // 座標値のハッシュを計算（点数が同じでも座標値が変わったら検知）
    const currentHash = memoCachedPoints
      .map((memoCachedPoint) => `${memoCachedPoint.x.toFixed(3)},${memoCachedPoint.y.toFixed(3)},${memoCachedPoint.z.toFixed(3)}`)
      .join('|');
    const coordsChanged = prevPointsHash.current !== currentHash;

    if ((!prev.current.equals(camera.matrixWorld) || ptsChanged || coordsChanged) && div !== null) {
      prev.current.copy(camera.matrixWorld);
      prevPtsLength.current = memoCachedPoints.length;
      prevPointsHash.current = currentHash;
      updateMetrics(camera);
    }
  });

  return (
    <Html
      as="div"
      ref={setDiv}
      fullscreen
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      zIndexRange={[0, 100]}
    >
      {editMetricPoints.map((point, idx) => {
        return (
          <MeasurementPoint
            key={`metrics-point-${idx}`}
            position={point}
            color="white"
          />
        );
      })}
      {metrics.map((item, idx) => {
        return <MeasurementLine key={`metrics-line-${idx}`} {...item} />;
      })}
    </Html>
  );
};

const MeasurementPoint: FC<{
  position: Vector3;
  color: string;
}> = ({ position, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '0px',
        right: '0px',
        top: '0px',
        bottom: '0px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%">
        <circle
          cx={position.x}
          cy={position.y}
          r={5}
          fill={color}
          stroke="black"
        />
      </svg>
    </div>
  );
};

const MeasurementLine: FC<{
  from: Vector3;
  to: Vector3;
  length: number;
}> = ({ from, to, length }) => {
  const data = useMemo(() => {
    const direction = to.clone().sub(from);
    const dirLength = direction.length();

    const normal = new Vector3(direction.y, -direction.x, 0);
    const offset_0 = new Vector3();

    const normalizedDirection = direction.clone().normalize();
    const rotation = Math.PI * 0.15;

    const arrowHeadLength = Math.min(dirLength * 0.25, 10);
    const arrowBodyLengthMin = 15;
    const arrowBodyLengthMax = 40;
    const opacity = Math.min(
      1,
      (dirLength - arrowBodyLengthMin) /
        (arrowBodyLengthMax - arrowBodyLengthMin)
    );

    const left = normalizedDirection
      .clone()
      .applyAxisAngle(new Vector3(0, 0, 1), rotation)
      .setLength(arrowHeadLength);
    const right = normalizedDirection
      .clone()
      .applyAxisAngle(new Vector3(0, 0, 1), -rotation)
      .setLength(arrowHeadLength);

    const head = to.clone().add(offset_0);
    const headLeft = head.clone().add(left.clone().negate());
    const headRight = head.clone().add(right.clone().negate());

    const tail = from.clone().add(offset_0);
    const tailLeft = tail.clone().add(left);
    const tailRight = tail.clone().add(right);

    const offset_1 = normal.clone().setLength(10);
    const labelPosition = from.clone().add(to).multiplyScalar(0.5).add(offset_1);

    const direction_2 = new Vector2(normalizedDirection.x, normalizedDirection.y).negate();
    const angle = direction_2.angle() * RAD2DEG;

    return {
      head,
      tail,
      headLeft,
      headRight,
      tailLeft,
      tailRight,
      opacity,
      angle,
      labelPosition,
    };
  }, [from, to, length]);

  return (
    <div
      style={{
        position: 'absolute',
        left: '0px',
        right: '0px',
        top: '0px',
        bottom: '0px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%">
        <g
          style={{
            stroke: 'black',
            strokeWidth: 2,
            mixBlendMode: 'difference',
          }}
        >
          <line
            x1={data.head.x}
            y1={data.head.y}
            x2={data.tail.x}
            y2={data.tail.y}
          />
          <line
            x1={data.head.x}
            y1={data.head.y}
            x2={data.headLeft.x}
            y2={data.headLeft.y}
          />
          <line
            x1={data.head.x}
            y1={data.head.y}
            x2={data.headRight.x}
            y2={data.headRight.y}
          />
          <line
            x1={data.tail.x}
            y1={data.tail.y}
            x2={data.tailLeft.x}
            y2={data.tailLeft.y}
          />
          <line
            x1={data.tail.x}
            y1={data.tail.y}
            x2={data.tailRight.x}
            y2={data.tailRight.y}
          />
        </g>
      </svg>
      <span
        style={{
          position: 'absolute',
          left: `${data.labelPosition.x}px`,
          top: `${data.labelPosition.y}px`,
          transform: `translate(-50%, -50%) rotate(${data.angle}deg)`,
          color: 'black',
          mixBlendMode: 'difference',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {length.toFixed(2)}m
      </span>
    </div>
  );
};

export { MeasurementView };
