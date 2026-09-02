/**
 * chroma-js の型宣言。
 *
 * tsconfig.json の `typeRoots: ["types"]` は `node_modules/@types` の自動読み込みを
 * 無効化するため、この宣言が chroma-js の唯一の型定義になる。
 * `@types/chroma-js` は依存に入っておらず、このファイルを削除するとビルドが壊れる。
 *
 * SDK が実際に使うのは src/components/ContractFileView.tsx の `chroma.scale()`、
 * その戻り値を関数として呼ぶシグネチャ、さらにその戻り値の `rgb()` の 3 つだけ。
 * 残りは upstream の API を先回りして宣言してあるので、ここに無い API を
 * 使うときは追記する。
 */
declare module "chroma-js" {
  interface ChromaScale {
    (value: number): ChromaInstance;
    colors(count?: number): string[];
    mode(mode: string): ChromaScale;
    domain(domain: number[]): ChromaScale;
    padding(padding: number | number[]): ChromaScale;
  }

  interface ChromaInstance {
    rgb(includeAlpha?: boolean): [number, number, number] | [number, number, number, number];
    hex(mode?: string): string;
    hsl(): [number, number, number];
    alpha(): number;
    alpha(a: number): ChromaInstance;
    darken(amount?: number): ChromaInstance;
    brighten(amount?: number): ChromaInstance;
    saturate(amount?: number): ChromaInstance;
    desaturate(amount?: number): ChromaInstance;
  }

  interface Chroma {
    (color: string | number | number[]): ChromaInstance;
    scale(colors?: string[] | string): ChromaScale;
    rgb(r: number, g: number, b: number): ChromaInstance;
    hsl(h: number, s: number, l: number): ChromaInstance;
    hex(color: string): ChromaInstance;
    valid(color: unknown): boolean;
    mix(
      color1: ChromaInstance | string,
      color2: ChromaInstance | string,
      ratio?: number,
      mode?: string
    ): ChromaInstance;
    interpolate(
      color1: ChromaInstance | string,
      color2: ChromaInstance | string,
      f: number,
      mode?: string
    ): ChromaInstance;
  }

  const chroma: Chroma;
  export default chroma;
}
