import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ViewerBridge, type Command } from "./viewerBridge";
import { CHANNEL } from "./viewerChannel";

type MessageListener = (e: MessageEvent) => void;

/**
 * vitest.config.ts は environment: "node" なので window が無い。
 * addEventListener / removeEventListener だけを持つ最小の偽 window を
 * vi.stubGlobal で差し込み、dispatch でイベントを流す。
 */
function createFakeWindow() {
  const listeners = new Set<MessageListener>();
  const target = {
    addEventListener(type: string, listener: MessageListener) {
      if (type === "message") listeners.add(listener);
    },
    removeEventListener(type: string, listener: MessageListener) {
      if (type === "message") listeners.delete(listener);
    },
  };
  const dispatch = (data: unknown, source: unknown = target) => {
    for (const listener of [...listeners]) {
      listener({ data, source } as unknown as MessageEvent);
    }
  };
  return { target, dispatch };
}

const validTransform: Command = {
  type: "SET_TRANSFORM",
  payload: {
    fileId: 12,
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 0, z: 90 },
  },
};

const validAppearance: Command = {
  type: "SET_APPEARANCE",
  payload: { fileId: 12, pointSize: 3, opacity: 50 },
};

describe("ViewerBridge.addListener", () => {
  let fakeWindow: ReturnType<typeof createFakeWindow>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fakeWindow = createFakeWindow();
    vi.stubGlobal("window", fakeWindow.target);
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("同じチャンネル名の正しいコマンドが届いたとき、ハンドラがそのコマンドで呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: validTransform });

    expect(handler).toHaveBeenCalledWith(validTransform);
  });

  it("別のチャンネル名で届いたとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: "OTHER_CHANNEL", cmd: validTransform });

    expect(handler).not.toHaveBeenCalled();
  });

  it("data を持たないイベントが届いたとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch(undefined);

    expect(handler).not.toHaveBeenCalled();
  });

  it("別のウィンドウから投げられたコマンドのとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);
    const anotherWindow = createFakeWindow().target;

    fakeWindow.dispatch({ channel: CHANNEL, cmd: validTransform }, anotherWindow);

    expect(handler).not.toHaveBeenCalled();
  });

  it("知らない type のコマンドが届いたとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "DROP_DATABASE" } });

    expect(handler).not.toHaveBeenCalled();
  });

  it("cmd がオブジェクトでないとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: "RESET" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_APPEARANCE に payload が無いとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "SET_APPEARANCE" } });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM に payload が無いとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "SET_TRANSFORM" } });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM の payload に fileId が無いとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: {
        type: "SET_TRANSFORM",
        payload: { translation: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0 } },
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM の fileId が数値でない文字列のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: { ...validTransform, payload: { ...validTransform.payload, fileId: "12" } },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM の translation がオブジェクトでない数値のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    // ガードを通すと受信側の `?? { x: 0, y: 0, z: 0 }` が発火せず、
    // three.js の position に undefined が 3 つ入って NaN になる。
    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: { type: "SET_TRANSFORM", payload: { fileId: 12, translation: 5 } },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM の translation の x が NaN のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: {
        type: "SET_TRANSFORM",
        payload: { fileId: 12, translation: { x: NaN, y: 0, z: 0 } },
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM の rotation の z が数値でない文字列のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: {
        type: "SET_TRANSFORM",
        payload: {
          fileId: 12,
          translation: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 0, z: "90" },
        },
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_TRANSFORM が translation だけを持つとき、省略された rotation は検証されずハンドラが呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);
    const cmd = {
      type: "SET_TRANSFORM",
      payload: { fileId: 12, translation: { x: 1, y: 2, z: 3 } },
    };

    fakeWindow.dispatch({ channel: CHANNEL, cmd });

    // 「回転は既定のまま平行移動だけ」は現に動いている使い方なので、通し続ける。
    expect(handler).toHaveBeenCalledWith(cmd);
  });

  it("SET_TRANSFORM に fileId しか入っていないとき、ハンドラはそのコマンドで呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);
    const cmd = { type: "SET_TRANSFORM", payload: { fileId: 12 } };

    fakeWindow.dispatch({ channel: CHANNEL, cmd });

    // 現状の仕様。translation / rotation が undefined のまま fileTransforms に入り、
    // そのファイルの位置と回転が黙って原点へ戻る。ガードは fileId しか見ていない。
    expect(handler).toHaveBeenCalledWith(cmd);
  });

  it("pointSize と opacity を持つ SET_APPEARANCE が届いたとき、ハンドラがそのコマンドで呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: validAppearance });

    expect(handler).toHaveBeenCalledWith(validAppearance);
  });

  it("SET_APPEARANCE が pointSize だけを持つとき、省略された opacity は検証されずハンドラが呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);
    const cmd = { type: "SET_APPEARANCE", payload: { pointSize: 3 } };

    fakeWindow.dispatch({ channel: CHANNEL, cmd });

    expect(handler).toHaveBeenCalledWith(cmd);
  });

  it("SET_APPEARANCE の pointSize が NaN のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: { type: "SET_APPEARANCE", payload: { pointSize: NaN, opacity: 50 } },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_APPEARANCE の opacity が数値でない文字列のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: { type: "SET_APPEARANCE", payload: { opacity: "50" } },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_APPEARANCE の fileId が NaN のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({
      channel: CHANNEL,
      cmd: { type: "SET_APPEARANCE", payload: { fileId: NaN, pointSize: 3 } },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("SET_APPEARANCE の payload が配列のとき、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "SET_APPEARANCE", payload: [] } });

    expect(handler).not.toHaveBeenCalled();
  });

  it("同一ウィンドウから形の不正なコマンドが届いたとき、警告が出る", () => {
    ViewerBridge.addListener(vi.fn());

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "DROP_DATABASE" } });

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("別のウィンドウから投げられたコマンドのとき、警告は出ない", () => {
    ViewerBridge.addListener(vi.fn());
    const anotherWindow = createFakeWindow().target;

    fakeWindow.dispatch({ channel: CHANNEL, cmd: validTransform }, anotherWindow);

    // 敵対的なページに console を溢れさせる手段を与えないため、外部由来は無言で落とす。
    expect(warn).not.toHaveBeenCalled();
  });

  it("source を持たないイベントで正しいコマンドが届いたとき、ハンドラは呼ばれず警告が出る", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    // jsdom / happy-dom の postMessage は MessageEvent.source をセットしない。
    fakeWindow.dispatch({ channel: CHANNEL, cmd: validTransform }, null);

    expect(handler).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("payload を持たない RESET が届いたとき、ハンドラが呼ばれる", () => {
    const handler = vi.fn();
    ViewerBridge.addListener(handler);

    fakeWindow.dispatch({ channel: CHANNEL, cmd: { type: "RESET" } });

    expect(handler).toHaveBeenCalledWith({ type: "RESET" });
  });

  it("購読解除したあとにコマンドが届いても、ハンドラは呼ばれない", () => {
    const handler = vi.fn();
    const unsubscribe = ViewerBridge.addListener(handler);

    unsubscribe();
    fakeWindow.dispatch({ channel: CHANNEL, cmd: validTransform });

    expect(handler).not.toHaveBeenCalled();
  });
});
