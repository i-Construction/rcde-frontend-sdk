declare module 'chroma-js' {
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
    mix(color1: ChromaInstance | string, color2: ChromaInstance | string, ratio?: number, mode?: string): ChromaInstance;
    interpolate(color1: ChromaInstance | string, color2: ChromaInstance | string, f: number, mode?: string): ChromaInstance;
  }

  const chroma: Chroma;
  export default chroma;
}

