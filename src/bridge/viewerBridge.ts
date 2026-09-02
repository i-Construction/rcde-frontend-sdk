import { CHANNEL } from "./viewerChannel";

export type UpAxis = "Y" | "Z";

// 座標系の定義
export const CoordinateSystem = {
  RightHandedXUp: "RIGHT_HANDED_X_UP",
  LeftHandedXUp: "LEFT_HANDED_X_UP",
  RightHandedYUp: "RIGHT_HANDED_Y_UP",
  LeftHandedYUp: "LEFT_HANDED_Y_UP",
  RightHandedZUp: "RIGHT_HANDED_Z_UP",
  LeftHandedZUp: "LEFT_HANDED_Z_UP",
} as const;

export type CoordinateSystemType = (typeof CoordinateSystem)[keyof typeof CoordinateSystem];

export type ViewerTransform = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // degree
  fileId: number; // RCDE DB ID (number)
};

export type ViewerAppearance = {
  pointSize: number;
  opacity: number;
  upAxis?: UpAxis;
  coordinateSystem?: CoordinateSystemType; // ファイル単位の座標系
  fileId?: number; // R-CDEのデータベースに登録されているファイルID
};

type Command =
  | { type: "SET_TRANSFORM"; payload: ViewerTransform }
  | { type: "SET_APPEARANCE"; payload: ViewerAppearance }
  | { type: "RESET" };

function post(cmd: Command) {
  if (typeof window === "undefined") return;
  // targetOrigin は "*" のまま。宛先が同一ウィンドウ自身なので、配送先のリスナーは
  // 常に同一オリジンのスクリプトに限られ、"*" でも他オリジンへは渡らない。
  // sandbox iframe ではオリジンが "null" になり window.location.origin を渡すと
  // 一致しなくなるため、"*" の方が壊れにくい。
  window.postMessage({ channel: CHANNEL, cmd }, "*");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * `postMessage` で届いた値を `Command` として扱ってよいか判定する。
 *
 * `src/index.ts` が `export * from "./bridge/viewerBridge"` しているため、
 * export するとパッケージの公開 API が増える。モジュール内に閉じる。
 */
function isViewerCommand(value: unknown): value is Command {
  if (!isRecord(value)) return false;

  switch (value.type) {
    case "RESET":
      return true;
    case "SET_APPEARANCE":
      // pointSize / opacity は受信側が既存値へフォールバックするため、
      // payload がオブジェクトであることまでを必須にする。
      return isRecord(value.payload);
    case "SET_TRANSFORM":
      // fileId は fileTransforms のキーになる。欠けていると `undefined` キーの
      // エントリが増えるだけで例外にならず、静かに壊れる。NaN も同じくキーが
      // "NaN" に潰れるため、Number.isFinite で数値かつ有限であることまで見る。
      return isRecord(value.payload) && Number.isFinite(value.payload.fileId);
    default:
      return false;
  }
}

export const ViewerBridge = {
  setTransform(tx: ViewerTransform) {
    post({ type: "SET_TRANSFORM", payload: tx });
  },
  setAppearance(app: ViewerAppearance) {
    post({ type: "SET_APPEARANCE", payload: app });
  },
  reset() {
    post({ type: "RESET" });
  },
  addListener(handler: (cmd: Command) => void) {
    if (typeof window === "undefined") return () => {};
    const listener = (e: MessageEvent) => {
      if (!e?.data || e.data.channel !== CHANNEL) return;
      // 送信元が同一ウィンドウのものだけ受け付ける。埋め込み元ページや iframe から
      // 投げられた message では source が相手の window になるため、ここで落ちる。
      // e.origin は見ない。同一ウィンドウ宛の postMessage では origin は常に自分自身に
      // なり、source の同一性判定より弱い条件にしかならないため。
      // 外部由来はログにも出さない（敵対的なページに console を溢れさせないため）。
      if (e.source !== window) {
        if (e.source === null || e.source === undefined) {
          // source が「相手の window」ではなく空のときは、攻撃ではなくテスト環境の
          // 制約であることが多い。jsdom / happy-dom の postMessage は
          // MessageEvent.source をセットしない（jsdom#2745）ため、これらの環境では
          // 形の正しいコマンドまで無言で落ちて原因不明の無反応になる。ここだけ警告する。
          // source を持つ外部 window からの message は従来どおり無言で落とす。
          console.warn(
            "[ViewerBridge] source を持たない message を無視しました。" +
              "jsdom / happy-dom の postMessage は MessageEvent.source をセットしないため、" +
              "これらのテスト環境ではビューアコマンドが届きません:",
            e.data.cmd
          );
        }
        return;
      }
      if (!isViewerCommand(e.data.cmd)) {
        // ここまで来たのは同一ウィンドウの、チャンネル名も合っているコマンド。
        // 利用側の実装ミスの可能性が高いので、握り潰さず気づけるようにする。
        console.warn("[ViewerBridge] 未知の形式のコマンドを無視しました:", e.data.cmd);
        return;
      }
      handler(e.data.cmd);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  },
};

export type { Command };
