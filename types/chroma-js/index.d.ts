/**
 * chroma-js の型宣言。
 *
 * tsconfig.json の `typeRoots: ["types"]` は `node_modules/@types` の自動読み込みを
 * 無効化するため、この宣言が chroma-js の唯一の型定義になる。
 * `@types/chroma-js` は依存に入っておらず、このファイルを削除するとビルドが壊れる。
 *
 * SDK が実際に使うのは src/components/ContractFileView.tsx の `chroma.scale()`、
 * その戻り値を関数として呼ぶシグネチャ、さらにその戻り値の `rgb()` の 3 つだけ。
 * upstream の API を先回りして宣言すると実際の挙動とのズレに誰も気づけないので、
 * 使う API が増えたときにその都度ここへ追記する。
 */
declare module "chroma-js" {
  interface ChromaScale {
    (value: number): ChromaInstance;
  }

  interface ChromaInstance {
    /** chroma-js 本来の引数は丸めの有無（既定 true）。アルファ込みは rgba()。 */
    rgb(round?: boolean): [number, number, number];
  }

  interface Chroma {
    scale(colors?: string[] | string): ChromaScale;
  }

  const chroma: Chroma;
  export default chroma;
}
