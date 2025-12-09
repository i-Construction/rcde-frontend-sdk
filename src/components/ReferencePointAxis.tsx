import { FC, useMemo } from 'react';
import { useReferencePoint } from '../contexts/referencePoint';
import { Vector3 } from 'three';

/**
 * Reference point axis component props
 */
export type ReferencePointAxisProps = {
  /**
   * Length of the axis arrows in world units
   * @default 10
   */
  length?: number;
  /**
   * Width of the axis arrows
   * @default 0.2
   */
  width?: number;
  /**
   * Whether to show the axis
   * @default true
   */
  visible?: boolean;
};

/**
 * Reference Point Axis Component
 *
 * Displays X/Y/Z axis arrows at the reference point position
 * - X axis: Red
 * - Y axis: Green
 * - Z axis: Blue
 *
 * @example
 * ```tsx
 * <ReferencePointAxis length={15} width={0.3} />
 * ```
 */
const ReferencePointAxis: FC<ReferencePointAxisProps> = ({
  length = 10,
  width = 0.2,
  visible = true,
}) => {
  const { point } = useReferencePoint();

  // Define axis directions and colors
  const axes = useMemo(
    () => [
      { direction: new Vector3(1, 0, 0), color: '#ff0000', label: 'X' }, // Red for X
      { direction: new Vector3(0, 1, 0), color: '#00ff00', label: 'Y' }, // Green for Y
      { direction: new Vector3(0, 0, 1), color: '#0000ff', label: 'Z' }, // Blue for Z
    ],
    []
  );

  if (!visible) {
    return null;
  }

  return (
    <group position={point}>
      {axes.map((axis) => (
        <arrowHelper
          key={axis.label}
          args={[axis.direction, new Vector3(0, 0, 0), length, axis.color, length * 0.2, width]}
        />
      ))}
    </group>
  );
};

export { ReferencePointAxis };
