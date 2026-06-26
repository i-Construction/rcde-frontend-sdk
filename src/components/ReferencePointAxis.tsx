import { FC, useMemo } from "react";
import { Vector3 } from "three";

/**
 * 基準点軸コンポーネントの props
 */
export type ReferencePointAxisProps = {
  /**
   * 軸矢印の長さ（ワールド単位）
   * @default 10
   */
  length?: number;
  /**
   * 軸矢印の太さ
   * @default 0.2
   */
  width?: number;
  /**
   * 軸を表示するかどうか
   * @default true
   */
  visible?: boolean;
  /**
   * 後方互換のため残している prop。
   * 基準点はシフト後のワールド原点 (0, 0, 0) に固定されるため、位置決定には使用しない。
   * @deprecated 位置指定には使用しない。軸は常に原点に描画される。
   */
  point?: Vector3 | { x: number; y: number; z: number } | null;
};

/**
 * 基準点軸コンポーネント
 *
 * 基準点（シフト後ワールド原点）に X/Y/Z 軸矢印を表示する。
 * - X 軸: 赤
 * - Y 軸: 緑
 * - Z 軸: 青
 *
 * 点群座標には `useReferencePoint` の `point` が加算されるため、
 * 基準点そのものは常にワールド原点に留まる。軸も原点に固定描画する。
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
  const axes = useMemo(
    () => [
      { direction: new Vector3(1, 0, 0), color: "#ff0000", label: "X" },
      { direction: new Vector3(0, 1, 0), color: "#00ff00", label: "Y" },
      { direction: new Vector3(0, 0, 1), color: "#0000ff", label: "Z" },
    ],
    []
  );

  if (!visible) {
    return null;
  }

  return (
    <group>
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
