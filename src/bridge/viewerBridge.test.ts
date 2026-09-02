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

describe("ViewerBridge.addListener", () => {
  let fakeWindow: ReturnType<typeof createFakeWindow>;

  beforeEach(() => {
    fakeWindow = createFakeWindow();
    vi.stubGlobal("window", fakeWindow.target);
    vi.spyOn(console, "warn").mockImplementation(() => {});
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
