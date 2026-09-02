import path from "node:path";
import type { NextConfig } from "next";

// リポジトリルートにも yarn.lock があるため、明示しないと Next がそちらを
// ワークスペースルートと推測して警告を出す。
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;
