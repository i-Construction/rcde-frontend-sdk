/**
 * ライブラリビルドでバンドルしないモジュール。
 * React の jsx-runtime を埋め込むと、ビルド時の React 内部 API が固定され、
 * 利用側の React と衝突する。
 *
 * @i-con/pcd-viewer は external にしない。0.0.27 の package.json は
 * main / module / types がいずれも src/index.ts を指しており、配布物に
 * ビルド済みの JS が無い。external のままだと利用側のバンドラが素の
 * TypeScript を読むことになり、Next.js なら transpilePackages と alias の
 * 設定を強いる。SDK のビルド時にコンパイルして取り込む。
 *
 * src からコンパイルするため、pcd-viewer が同梱していた React の
 * jsx-runtime は入ってこない。JSX は SWC の automatic runtime が
 * external の react/jsx-runtime へ解決する。
 */
export function isSdkBuildExternal(id: string): boolean {
  const normalized = id.replace(/\\/g, "/");
  return (
    id === "react" ||
    id === "react-dom" ||
    id.startsWith("react/") ||
    id.startsWith("react-dom/") ||
    /(^|\/)node_modules\/react\//.test(normalized) ||
    /(^|\/)node_modules\/react-dom\//.test(normalized) ||
    id === "@react-three/fiber" ||
    id === "@react-three/drei" ||
    id === "three"
  );
}
