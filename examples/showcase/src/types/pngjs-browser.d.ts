/**
 * `pngjs/browser` の型宣言。
 *
 * SDK と `@i-con/pcd-viewer` を `src` から直接コンパイルしているため、両パッケージが使う
 * `pngjs/browser` の型がこのプロジェクト側でも必要になる。両パッケージは同等の宣言を
 * `types/` に同梱しているが、`tsconfig.json` の `exclude: ["node_modules"]` によって
 * `include` に書いても読み込まれないので、ここで同じ宣言を持つ。
 *
 * `@types/pngjs` は使えない。`PNG.parse` を `string | Buffer` で宣言しており、
 * `ArrayBuffer` を渡す SDK / pcd-viewer の呼び出しが型エラーになる。
 */
declare module "pngjs/browser" {
  export class PNG {
    data: Uint8Array;
    width: number;
    height: number;
    constructor();
    parse(data: ArrayBuffer): PNG;
    on(event: "parsed", callback: () => void): PNG;
    on(event: "error", callback: (error: Error) => void): PNG;
  }
}
