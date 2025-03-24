
declare module 'pngjs/browser' {
  export class PNG {
    constructor ();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parse (data: ArrayBuffer): any;
  }
}
