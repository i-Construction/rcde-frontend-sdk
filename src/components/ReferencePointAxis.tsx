import { FC, useMemo } from 'react';
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
  /**
   * Reference point position to display the axis at
   * If not provided, the axis will not be displayed
   */
  point?: Vector3 | { x: number; y: number; z: number } | null;
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
 * <ReferencePointAxis length={15} width={0.3} point={new Vector3(0, 0, 0)} />
 * ```
 */
const ReferencePointAxis: FC<ReferencePointAxisProps> = ({
  length = 10,
  width = 0.2,
  visible = true,
  point,
}) => {
  // #region agent log - immediate
  fetch('http://127.0.0.1:7243/ingest/6eab1057-cfff-4b64-add2-7a6caa163cfb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReferencePointAxis.tsx:MOUNT',message:'component function called',data:{point:point?{x:(point as any).x,y:(point as any).y,z:(point as any).z}:null,visible,length,width},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  // Convert point to Vector3 if needed
  const position = useMemo(() => {
    if (!point) return null;
    if (point instanceof Vector3) return point;
    return new Vector3(point.x, point.y, point.z);
  }, [point]);

  // #region agent log
  useMemo(() => {
    fetch('http://127.0.0.1:7243/ingest/6eab1057-cfff-4b64-add2-7a6caa163cfb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReferencePointAxis.tsx',message:'internal state',data:{point:point?{x:point.x,y:point.y,z:point.z}:null,position:position?{x:position.x,y:position.y,z:position.z}:null,visible,willRender:!!(visible && position)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
  }, [point, position, visible]);
  // #endregion

  // Define axis directions and colors
  const axes = useMemo(
    () => [
      { direction: new Vector3(1, 0, 0), color: '#ff0000', label: 'X' }, // Red for X
      { direction: new Vector3(0, 1, 0), color: '#00ff00', label: 'Y' }, // Green for Y
      { direction: new Vector3(0, 0, 1), color: '#0000ff', label: 'Z' }, // Blue for Z
    ],
    []
  );

  if (!visible || !position) {
    return null;
  }

  return (
    <group position={position}>
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
