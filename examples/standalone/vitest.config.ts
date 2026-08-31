import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// example-poc の純粋ロジック向けユニットテスト設定。
// next/headers や SDK クライアントは各テスト内で vi.mock する。
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
