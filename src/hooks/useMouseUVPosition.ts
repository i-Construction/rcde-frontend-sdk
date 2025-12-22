import { useCallback } from 'react';
import { Vector2 } from 'three';

export const useMouseUVPosition = (props: { canvas: HTMLCanvasElement }) => {
  const { canvas } = props;
  return useCallback(
    (e: MouseEvent) => {
      const position = new Vector2(e.clientX, e.clientY);
      const { x, y, width, height } = canvas.getBoundingClientRect();
      position.sub(new Vector2(x, y));
      return new Vector2(
        (position.x / width) * 2 - 1,
        -(position.y / height) * 2 + 1
      );
    },
    [canvas]
  );
};
