import { Line, PivotControls } from '@react-three/drei';
import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ColorRepresentation,
  Matrix4,
  Plane,
  Quaternion,
  Vector3,
} from 'three';
import { useClippingPlanes } from '../contexts/clippingPlanes';

export const CrossSectionHandler: FC = () => {
  const [plane, setPlane] = useState<Plane>(
    new Plane().setFromNormalAndCoplanarPoint(
      new Vector3(0, 0, -1),
      new Vector3()
    )
  );
  const { setClippingPlanes } = useClippingPlanes();

  useEffect(() => {
    setClippingPlanes([plane]);
    return () => {
      setClippingPlanes([]);
    };
  }, [plane, setClippingPlanes]);

  const handleDrag = useCallback((l: Matrix4) => {
    const translation = new Vector3();
    const rotation = new Quaternion();
    l.decompose(translation, rotation, new Vector3());
    const normal = new Vector3(0, 0, -1);
    normal.applyQuaternion(rotation).normalize();
    const n = new Plane().setFromNormalAndCoplanarPoint(normal, translation);
    setPlane(n);
  }, []);

  return (
    <PivotControls scale={50} fixed disableScaling onDrag={handleDrag}>
      <CrossSectionPlane size={1e2} />
    </PivotControls>
  );
};

export const CrossSectionPlane: FC<{
  size: number;
  color?: ColorRepresentation;
  opacity?: number;
}> = ({ size, color = 'yellow', opacity = 0.85 }) => {
  const rectangle = useMemo(() => {
    const pts = [
      new Vector3(-size / 2, -size / 2, 0),
      new Vector3(size / 2, -size / 2, 0),
      new Vector3(size / 2, size / 2, 0),
      new Vector3(-size / 2, size / 2, 0),
    ];
    return [...pts, pts[0]];
  }, [size]);

  const lt2rb = useMemo(() => {
    return [
      new Vector3(-size / 2, -size / 2, 0),
      new Vector3(size / 2, size / 2, 0),
    ];
  }, [size]);

  const rt2lb = useMemo(() => {
    return [
      new Vector3(size / 2, -size / 2, 0),
      new Vector3(-size / 2, size / 2, 0),
    ];
  }, [size]);

  return (
    <group>
      <Line points={rectangle} color={color} transparent opacity={opacity} />
      <Line points={lt2rb} color={color} transparent opacity={opacity} />
      <Line points={rt2lb} color={color} transparent opacity={opacity} />
    </group>
  );
};

