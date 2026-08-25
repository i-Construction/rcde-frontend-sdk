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
