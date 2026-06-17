import { defineConfig } from "vitest/config";

// SDK 本体のユニットテスト設定（ビルド用 vite.config.ts とは分離）
export default defineConfig({
  test: {
    globals: true,
    // Blob / ReadableStream / FormData / fetch は Node 22 でグローバル提供されるため node 環境で十分
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
