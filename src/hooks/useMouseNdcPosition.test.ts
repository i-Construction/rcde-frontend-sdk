import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useMouseNdcPosition } from "./useMouseNdcPosition";

/**
 * useEffect を持たないフックなので、SSR の単発レンダリングで戻り値を捕捉すれば十分。
 * useCallback はマウント時に評価される。
 */
function captureHook<T>(useHook: () => T): T {
  let captured: T | undefined;
  const Probe = () => {
    captured = useHook();
    return null;
  };
  renderToStaticMarkup(createElement(Probe));
  return captured as T;
}

/** getBoundingClientRect() だけを持つ偽キャンバス。vitest の environment は node なので DOM は無い。 */
const canvasAt = (rect: { left: number; top: number; width: number; height: number }) =>
  ({
    getBoundingClientRect: () => ({
      x: rect.left,
      y: rect.top,
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      width: rect.width,
      height: rect.height,
      toJSON: () => ({}),
    }),
  }) as unknown as HTMLCanvasElement;

/** clientX / clientY だけを持つ偽マウスイベント。 */
const mouseAt = (clientX: number, clientY: number) =>
  ({ clientX, clientY }) as unknown as MouseEvent;

describe("useMouseNdcPosition", () => {
  it("キャンバスが画面の左上に接しているとき、キャンバス中央のマウス位置は NDC の原点 (0, 0) になる", () => {
    const toNdc = captureHook(() =>
      useMouseNdcPosition({ canvas: canvasAt({ left: 0, top: 0, width: 800, height: 400 }) })
    );

    const ndc = toNdc(mouseAt(400, 200));

    expect(ndc.x).toBeCloseTo(0);
    expect(ndc.y).toBeCloseTo(0);
  });

  it("キャンバスが画面の左上から離れているとき、キャンバス左上のマウス位置は NDC の (-1, 1) になる", () => {
    const toNdc = captureHook(() =>
      useMouseNdcPosition({ canvas: canvasAt({ left: 100, top: 50, width: 800, height: 400 }) })
    );

    const ndc = toNdc(mouseAt(100, 50));

    expect(ndc.x).toBeCloseTo(-1);
    expect(ndc.y).toBeCloseTo(1);
  });

  it("キャンバスが画面の左上から離れているとき、キャンバス右下のマウス位置は NDC の (1, -1) になる", () => {
    const toNdc = captureHook(() =>
      useMouseNdcPosition({ canvas: canvasAt({ left: 100, top: 50, width: 800, height: 400 }) })
    );

    const ndc = toNdc(mouseAt(900, 450));

    expect(ndc.x).toBeCloseTo(1);
    expect(ndc.y).toBeCloseTo(-1);
  });

  it("キャンバスが横長でオフセットもあるとき、横と縦はそれぞれの辺長で別々に正規化される", () => {
    const toNdc = captureHook(() =>
      useMouseNdcPosition({ canvas: canvasAt({ left: 100, top: 50, width: 800, height: 400 }) })
    );

    // キャンバス左上を原点とすると (600, 100)。x は 800、y は 400 で正規化される。
    const ndc = toNdc(mouseAt(700, 150));

    expect(ndc.x).toBeCloseTo(0.5);
    expect(ndc.y).toBeCloseTo(0.5);
  });
});
