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
  const vec = point.clone().project(camera);
  const screenPos = new Vector3(((vec.x + 1) / 2) * width, (-(vec.y - 1) / 2) * height, 0);
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

  const pts = useMemo(() => {
    if (points !== undefined) {
      return points;
    }
    return [];
  }, [points]);

  const offset = useMemo(() => {
    return referencePoint !== undefined ? referencePoint : new Vector3();
  }, [referencePoint]);

  const updateMetrics = useCallback(
    (c: Camera) => {
      const transformedPoints = pts.map((pt) => {
        return pt.clone().add(offset);
      });
      if (div === null || transformedPoints.length < 1) return [];

      const viewPoints = transformedPoints.map((p) => {
        const viewPoint = getViewMetricPoints(div, c, p);
        return viewPoint;
      });
      if (edit) setEditMetricPoints(viewPoints);

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
    [div, edit, offset, pts]
  );

  // 点群が変更されたときにも更新
  useEffect(() => {
    if (div !== null && pts.length > 0) {
      console.log(`[MeasurementView] pts changed: ${pts.length} points`);
      updateMetrics(camera);
    }
  }, [pts, div, camera, updateMetrics]);

  useFrame(({ camera: c }) => {
    const ptsChanged = prevPtsLength.current !== pts.length;
    if ((!prev.current.equals(c.matrixWorld) || ptsChanged) && div !== null) {
      prev.current.copy(c.matrixWorld);
      prevPtsLength.current = pts.length;
      updateMetrics(c);
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
    const dir = to.clone().sub(from);
    const dirLength = dir.length();

    const normal = new Vector3(dir.y, -dir.x, 0);
    const o0 = new Vector3();

    const normalizedDir = dir.clone().normalize();
    const rot = Math.PI * 0.15;

    const arrowHeadLength = Math.min(dirLength * 0.25, 10);
    const arrowBodyLengthMin = 15;
    const arrowBodyLengthMax = 40;
    const opacity = Math.min(
      1,
      (dirLength - arrowBodyLengthMin) /
        (arrowBodyLengthMax - arrowBodyLengthMin)
    );

    const left = normalizedDir
      .clone()
      .applyAxisAngle(new Vector3(0, 0, 1), rot)
      .setLength(arrowHeadLength);
    const right = normalizedDir
      .clone()
      .applyAxisAngle(new Vector3(0, 0, 1), -rot)
      .setLength(arrowHeadLength);

    const head = to.clone().add(o0);
    const headLeft = head.clone().add(left.clone().negate());
    const headRight = head.clone().add(right.clone().negate());

    const tail = from.clone().add(o0);
    const tailLeft = tail.clone().add(left);
    const tailRight = tail.clone().add(right);

    const o1 = normal.clone().setLength(10);
    const wp = from.clone().add(to).multiplyScalar(0.5).add(o1);

    const d2 = new Vector2(normalizedDir.x, normalizedDir.y).negate();
    const angle = d2.angle() * RAD2DEG;

    return {
      head,
      tail,
      headLeft,
      headRight,
      tailLeft,
      tailRight,
      opacity,
      angle,
      wp,
    };
  }, [from, to]);

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
            stroke: 'white',
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
          left: `${data.wp.x}px`,
          top: `${data.wp.y}px`,
          transform: `translate(-50%, -50%) rotate(${data.angle}deg)`,
          color: 'white',
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
