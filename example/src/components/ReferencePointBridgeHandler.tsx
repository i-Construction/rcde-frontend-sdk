"use client";

import { useReferencePoint } from "@i-con/frontend-sdk";
import { useEffect } from "react";

import { referencePointBridge } from "@/lib/reference-point-bridge";

/**
 * RCDE children 内に配置し、ブリッジ経由の基準点変更を useReferencePoint.change に反映する。
 */
export function ReferencePointBridgeHandler() {
  const { point, change } = useReferencePoint();

  useEffect(() => {
    return referencePointBridge.registerApplyHandler((coordinates) => {
      const next = point.clone();
      next.set(coordinates.x, coordinates.y, coordinates.z);
      change(next);
    });
  }, [change, point]);

  useEffect(() => {
    return referencePointBridge.registerCurrentPointProvider(() => ({
      x: point.x,
      y: point.y,
      z: point.z,
    }));
  }, [point]);

  return null;
}
