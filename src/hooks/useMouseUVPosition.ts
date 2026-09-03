import { useCallback } from "react";
import { toNormalizedDeviceCoordinates } from "../lib/viewerMath";

export const useMouseUVPosition = (props: { canvas: HTMLCanvasElement }) => {
  const { canvas } = props;
  return useCallback(
    (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return toNormalizedDeviceCoordinates({ x: e.clientX - rect.x, y: e.clientY - rect.y }, rect);
    },
    [canvas]
  );
};
