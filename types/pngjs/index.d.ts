
declare module 'pngjs/browser' {
  export class PNG {
    constructor ();
    parse (data: ArrayBuffer): any;
  }
}
