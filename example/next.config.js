/** @type {import('next').NextConfig} */
const path = require("path");

const exampleNodeModules = path.resolve(__dirname, "node_modules");
const sdkSrc = path.resolve(__dirname, "../src");

const nextConfig = {
  transpilePackages: [
    "@i-con/frontend-sdk",
    "@i-con/pcd-viewer",
    "@react-three/fiber",
    "@react-three/drei",
  ],
  serverExternalPackages: ["three"],
  outputFileTracingRoot: path.join(__dirname, ".."),
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i-con/frontend-sdk": sdkSrc,
      "@i-con/pcd-viewer": path.join(exampleNodeModules, "@i-con/pcd-viewer"),
    };

    if (isServer) {
      return config;
    }

    // file:../ SDK 経由で親 node_modules（React 18 / fiber 8）が解決されるのを防ぐ
    config.resolve.modules = [exampleNodeModules, ...(config.resolve.modules ?? ["node_modules"])];
    // Webpack 5 には resolve.dedupe がないため alias で単一インスタンスを強制する
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.join(exampleNodeModules, "react"),
      "react-dom": path.join(exampleNodeModules, "react-dom"),
      "react/jsx-runtime": path.join(exampleNodeModules, "react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(exampleNodeModules, "react/jsx-dev-runtime.js"),
      "@i-con/pcd-viewer": path.join(exampleNodeModules, "@i-con/pcd-viewer"),
      "@react-three/fiber": path.join(exampleNodeModules, "@react-three/fiber"),
      "@react-three/drei": path.join(exampleNodeModules, "@react-three/drei"),
      xstate: path.join(exampleNodeModules, "xstate"),
      "@xstate/react": path.join(exampleNodeModules, "@xstate/react"),
    };
    return config;
  },
};

module.exports = nextConfig;
