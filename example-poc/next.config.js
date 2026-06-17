/** @type {import('next').NextConfig} */
const path = require("path");

const pocNodeModules = path.resolve(__dirname, "node_modules");

const nextConfig = {
  transpilePackages: ["@react-three/fiber", "@react-three/drei"],
  serverExternalPackages: ["three"],
  outputFileTracingRoot: path.join(__dirname, ".."),
  webpack: (config, { isServer }) => {
    if (isServer) {
      return config;
    }

    // file:../ SDK 経由で親 node_modules（React 18 / fiber 8）が解決されるのを防ぐ
    config.resolve.modules = [
      pocNodeModules,
      ...(config.resolve.modules ?? ["node_modules"]),
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.join(pocNodeModules, "react"),
      "react-dom": path.join(pocNodeModules, "react-dom"),
      "@react-three/fiber": path.join(pocNodeModules, "@react-three/fiber"),
      "@react-three/drei": path.join(pocNodeModules, "@react-three/drei"),
    };
    return config;
  },
};

module.exports = nextConfig;
