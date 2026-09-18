/**
 * ライブラリビルドでバンドルしないモジュール。
 * React の jsx-runtime や pcd-viewer の事前ビルド成果物を埋め込むと、
 * ビルド時の React 内部 API が固定され、利用側の React と衝突する。
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
    id === "@i-con/pcd-viewer" ||
    id.startsWith("@i-con/pcd-viewer/") ||
    id === "three"
  );
}
