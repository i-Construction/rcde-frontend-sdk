"use client";

import { useCallback } from "react";
import {
  MeasurementHandler,
  MeasurementView,
  type MeasurementHandlerProps,
} from "@i-con/frontend-sdk";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

/**
 * 計測ツールの R3F レイヤー。
 *
 * `MeasurementHandler` は計測点を自前のローカル state で持ち、内部で `MeasurementView` を
 * `edit` 付きで描画する。SDK 側に計測用の Context はないため、確定した点は `onChange` で
 * 受け取ってアプリ側（`useWorkspace`）に蓄える。
 *
 * `MeasurementHandler` の内部 state は 2 点確定した 2 秒後にリセットされるので、
 * 確定済みの計測線を残すために `MeasurementView` を単体でも描画する。
 * `MeasurementHandler` 側の描画と重複しないよう、こちらは 2 点以上そろったときだけ出す。
 */
export function MeasurementLayer() {
  const { measurementEnabled, measurementPoints, setMeasurementPoints } = useWorkspace();

  const handleChange = useCallback<NonNullable<MeasurementHandlerProps["onChange"]>>(
    (nextPoints) => {
      setMeasurementPoints(nextPoints);
    },
    [setMeasurementPoints]
  );

  // 計測モードが OFF のときは何も描画しない。
  // `MeasurementHandler` はマウント中キャンバスの click を stopImmediatePropagation で
  // 奪うため、置いたままにするとファイル選択（onObjectClick）が動かなくなる。
  if (!measurementEnabled) {
    return null;
  }

  return (
    <>
      {/* 入力ハンドリング。渡すのは onChange のみで、編集中の表示は内部の MeasurementView が担う。 */}
      <MeasurementHandler onChange={handleChange} />

      {/*
        確定済みの計測線を常時表示する。
        `points` は MeasurementHandler がシーンから直接ピックしたワールド座標で、
        すでに基準点オフセットが加算済み。`MeasurementView` は `referencePoint` を
        受け取ると内部で points に加算するため、ここで渡すと二重加算になる。
        よって `referencePoint` は渡さない。
      */}
      {measurementPoints.length >= 2 && <MeasurementView points={measurementPoints} edit={false} />}
    </>
  );
}
