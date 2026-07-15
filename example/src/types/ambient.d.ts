// pcd-viewer が参照する pngjs のブラウザ向けエントリ（型定義なし）
declare module "pngjs/browser" {
  export class PNG {
    parse(buffer: ArrayBuffer): PNG;
    on(event: "parsed", listener: () => void): void;
    width: number;
    height: number;
    data: Buffer;
  }
}
