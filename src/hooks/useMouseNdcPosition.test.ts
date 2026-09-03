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

/** キャンバスの画面上の位置と大きさ。 */
type CanvasLayout = { left: number; top: number; width: number; height: number };

const domRectOf = (layout: CanvasLayout) => ({
  x: layout.left,
  y: layout.top,
  left: layout.left,
  top: layout.top,
  right: layout.left + layout.width,
  bottom: layout.top + layout.height,
  width: layout.width,
  height: layout.height,
  toJSON: () => ({}),
});

/** getBoundingClientRect() だけを持つ偽キャンバス。vitest の environment は node なので DOM は無い。 */
const canvasAt = (layout: CanvasLayout) =>
  ({ getBoundingClientRect: () => domRectOf(layout) }) as unknown as HTMLCanvasElement;

/**
 * getBoundingClientRect() を呼ばれた回数だけ数え、呼ばれるたびに次のレイアウトを返す偽キャンバス。
 * ウィンドウサイズ変更やサイドバーの開閉でキャンバスが動いた状況を、イベントの合間に再現する。
 * 最後のレイアウトに到達したあとはそれを返し続ける。
 */
const canvasMovingThrough = (layouts: CanvasLayout[]) => {
  let calls = 0;
  return {
    getBoundingClientRect: () => domRectOf(layouts[Math.min(calls++, layouts.length - 1)]),
  } as unknown as HTMLCanvasElement;
};

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

  it("キャンバスが 2 つのイベントの合間に移動して大きさも変わったとき、2 回目の変換は移動後のキャンバス右下を NDC の (1, -1) にする", () => {
    const canvas = canvasMovingThrough([
      { left: 100, top: 50, width: 800, height: 400 },
      { left: 300, top: 150, width: 400, height: 200 },
    ]);
    const toNdc = captureHook(() => useMouseNdcPosition({ canvas }));

    // 1 回目は移動前のキャンバス左上、2 回目は移動後のキャンバス右下を指すマウス位置。
    const beforeMove = toNdc(mouseAt(100, 50));
    const afterMove = toNdc(mouseAt(700, 350));

    expect(beforeMove.x).toBeCloseTo(-1);
    expect(beforeMove.y).toBeCloseTo(1);
    expect(afterMove.x).toBeCloseTo(1);
    expect(afterMove.y).toBeCloseTo(-1);
  });
});
