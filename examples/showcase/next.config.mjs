import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localNodeModules = path.resolve(__dirname, "node_modules");

// SDK は link:../../ でリポジトリルートを参照するが、dist ではなく src を直接
// transpile する。dist を挟まないので SDK を編集したら即反映され、レビュー時に
// ルートの build を先に走らせる必要もない。
// npm 公開版に切り替えたら、この alias と transpilePackages の SDK 分は不要になる。
const sdkSrc = path.resolve(__dirname, "../../src");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@i-con/frontend-sdk",
    "@i-con/pcd-viewer",
    "@react-three/fiber",
    "@react-three/drei",
  ],
  serverExternalPackages: ["three"],
  // SDK の src をリポジトリルートから読むため、トレースの基点もルートに合わせる
  outputFileTracingRoot: path.join(__dirname, "../.."),
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i-con/frontend-sdk": sdkSrc,
      // pcd-viewer も package.json の main が src を指すため transpile 対象。
      // サーバー側ビルドでも同じ実体を使わせる。
      "@i-con/pcd-viewer": path.join(localNodeModules, "@i-con/pcd-viewer"),
    };

    // SDK の src はリポジトリルート配下にあるため、放っておくとルートの
    // node_modules の React 18 が解決され、このアプリの React 19 と混ざって
    // ReactCurrentBatchConfig 未定義で落ちる。探索順の先頭をこのアプリの
    // node_modules にして解決先を揃える。
    // サーバー側で react を alias してはいけない（Next が RSC 用に react-server
    // 条件付きの実体へ向けている alias を潰し、useContext が null になる）。
    config.resolve.modules = [localNodeModules, ...(config.resolve.modules ?? ["node_modules"])];

    if (isServer) {
      return config;
    }

    // SDK やルートの node_modules 配下の React / fiber が解決されて
    // インスタンスが二重化するのを防ぐ。
    // R3F は単一インスタンスでないと Reconciler が壊れる。
    // Webpack 5 に resolve.dedupe は無いため alias で単一インスタンスを強制する。
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.join(localNodeModules, "react"),
      "react-dom": path.join(localNodeModules, "react-dom"),
      "react/jsx-runtime": path.join(localNodeModules, "react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(localNodeModules, "react/jsx-dev-runtime.js"),
      "@react-three/fiber": path.join(localNodeModules, "@react-three/fiber"),
      "@react-three/drei": path.join(localNodeModules, "@react-three/drei"),
      three: path.join(localNodeModules, "three"),
    };
    return config;
  },
};

export default nextConfig;
