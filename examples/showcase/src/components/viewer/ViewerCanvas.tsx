"use client";

import { useCallback, useMemo } from "react";
import {
  Viewer,
  type ContractFile,
  type RCDEAppConfig,
  type ViewerClickEvent,
  type ViewerHoverEvent,
  type ViewerProps,
} from "@i-con/frontend-sdk";
import type { Box3 } from "three";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import { formatVector } from "@/lib/format";
import { CustomContractFileLayer } from "./CustomContractFileLayer";
import { CustomR3FLayer } from "./CustomR3FLayer";
import { MeasurementLayer } from "./MeasurementLayer";

/**
 * 中央ペインの本体。SDK の `Viewer` をほぼ全 props 指定で使う。
 *
 * `Viewer` は `ViewerProviders` が並べた各 Context の配下に置く必要がある。
 * `children` に渡した要素は Canvas 内（R3F シーン内）へ、
 * `auxiliaryContent` は Canvas の横に並ぶ DOM として描画される。
 */
export function ViewerCanvas({ app }: { app: RCDEAppConfig }) {
  const {
    constructionId,
    contractId,
    selectedFileId,
    setSelectedFileId,
    refetchKey,
    r3fFlags,
    memoryMonitoring,
    pushEvent,
  } = useWorkspace();

  const r3f = useMemo<ViewerProps["r3f"]>(
    () => ({
      // `canvas` は R3F の `Canvas` へそのまま渡される。Viewer 既定のカメラ設定を
      // 壊さないよう、ここではレンダラ側のオプションだけを上書きする。
      canvas: { gl: { antialias: true } },
      map: r3fFlags.map,
      light: r3fFlags.light,
      grid: r3fFlags.grid,
      gizmo: r3fFlags.gizmo,
      // 基準点軸は CustomR3FLayer で自前に描画するため、既定では無効化する。
      referencePointAxis: r3fFlags.referencePointAxis,
    }),
    [r3fFlags]
  );

  /** レガシー API。`onObjectClick` と同時に発火する。 */
  const handleContractFileClick = useCallback(
    (file: ContractFile | undefined, boundingBox: Box3 | undefined) => {
      if (file === undefined) {
        pushEvent({
          kind: "click",
          label: "onContractFileClick: 対象なし",
          detail: "空白がクリックされたため選択を解除しました",
        });
        setSelectedFileId(undefined);
        return;
      }

      pushEvent({
        kind: "click",
        label: `onContractFileClick: ${file.name}`,
        detail:
          boundingBox === undefined
            ? undefined
            : `BBox min ${formatVector(boundingBox.min)} / max ${formatVector(boundingBox.max)}`,
      });
      setSelectedFileId(file.id);
    },
    [pushEvent, setSelectedFileId]
  );

  const handleObjectClick = useCallback(
    (event: ViewerClickEvent) => {
      if (!event.hit) {
        pushEvent({
          kind: "click",
          label: "onObjectClick: 空白クリック（選択解除）",
          detail: `画面座標 (${event.screenPosition.x}, ${event.screenPosition.y})`,
        });
        return;
      }

      pushEvent({
        kind: "click",
        label: `onObjectClick: ${event.file.name}`,
        detail: [
          `交点(ワールド) ${formatVector(event.intersectionPoint)}`,
          `交点(オフセット前) ${formatVector(event.localIntersectionPoint)}`,
          `画面座標 (${event.screenPosition.x}, ${event.screenPosition.y})`,
        ].join(" / "),
      });
    },
    [pushEvent]
  );

  const handleObjectHover = useCallback(
    (event: ViewerHoverEvent) => {
      if (!event.hit) {
        pushEvent({ kind: "hover", label: "onObjectHover: 離脱（hit: false）" });
        return;
      }

      pushEvent({
        kind: "hover",
        label: `onObjectHover: ${event.file.name}`,
        detail: `画面座標 (${event.screenPosition.x}, ${event.screenPosition.y})`,
      });
    },
    [pushEvent]
  );

  /**
   * 基準点オフセット位置に描画される R3F 要素。
   * Viewer 内部で `<group position={point}>{positionOffsetComponent}</group>`
   * として Canvas 内に置かれるため、DOM ではなく R3F 要素を渡すこと。
   */
  const positionOffsetComponent = useMemo(
    () => (
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="yellow" wireframe />
      </mesh>
    ),
    []
  );

  /**
   * Viewer の MUI Box 内でキャンバスの横に並ぶ DOM。
   * `positionOffsetComponent` と併用できることを示すための細い縦帯。
   */
  const auxiliaryContent = useMemo(
    () => (
      <div
        className="text-muted-foreground bg-muted/40 flex w-7 shrink-0 items-center justify-center border-l text-[10px] tracking-wider"
        style={{ writingMode: "vertical-rl" }}
      >
        auxiliaryContent
      </div>
    ),
    []
  );

  if (constructionId === undefined || contractId === undefined) {
    return (
      <div className="viewer-host flex items-center justify-center">
        <p className="text-muted-foreground text-sm">ヘッダーで現場と契約を選択してください</p>
      </div>
    );
  }

  return (
    <div className="viewer-host">
      {/*
        `contractFileIds` は意図的に渡していない。
        未指定の場合、Viewer は契約に紐づく全ファイルを表示対象として読み込む。
        表示するファイルの絞り込みは左ペインの表示切り替え（useContractFiles）で行うため、
        ここで ID を固定してしまうと全機能デモにならない。
      */}
      <Viewer
        app={app}
        constructionId={constructionId}
        contractId={contractId}
        r3f={r3f}
        selectedFileId={selectedFileId}
        contractFilesRefetchKey={refetchKey}
        onContractFileClick={handleContractFileClick}
        onObjectClick={handleObjectClick}
        onObjectHover={handleObjectHover}
        memoryMonitoring={memoryMonitoring}
        positionOffsetComponent={positionOffsetComponent}
        auxiliaryContent={auxiliaryContent}
      >
        {/* children は Canvas 内（R3F シーン内）に置かれるため、DOM ではなく R3F 要素を渡す */}
        <MeasurementLayer />
        <CustomR3FLayer />
        <CustomContractFileLayer />
      </Viewer>
    </div>
  );
}
