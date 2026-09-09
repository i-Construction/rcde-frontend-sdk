"use client";

import { ReferencePointAxis, useReferencePoint } from "@i-con/frontend-sdk";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

/**
 * 基準点まわりの独自 R3F 描画デモ。
 *
 * - Viewer 内蔵の基準点軸は `r3f.referencePointAxis: false` で無効化しているため、
 *   ここで `ReferencePointAxis` を自前に描画し、長さ・太さ・表示を UI から制御する。
 * - `useReferencePoint()` の `point` に追従する独自オブジェクトも描画する。
 */
export function CustomR3FLayer() {
  const { point } = useReferencePoint();
  const { customLayerVisible, axisConfig } = useWorkspace();

  return (
    <>
      {/* 基準点軸は常にワールド原点（シフト後の基準点）へ描画される */}
      <ReferencePointAxis
        length={axisConfig.length}
        width={axisConfig.width}
        visible={axisConfig.visible}
      />

      {/*
        独自オブジェクト。`position` に `useReferencePoint()` の `point` を渡しているため、
        基準点を変更（ファイルへフォーカスなど）すると、この赤いボックスも一緒に移動する。
        点群側は座標に `point` が加算されて描画されるので、
        同じ `point` を position に持つこのボックスは点群と同じ相対位置を保つ。
      */}
      {customLayerVisible && (
        <group position={point}>
          <mesh>
            <boxGeometry args={[5, 5, 5]} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
        </group>
      )}
    </>
  );
}
