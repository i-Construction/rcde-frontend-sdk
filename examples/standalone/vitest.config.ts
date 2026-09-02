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
    // テストがまだ無い状態でも CI を落とさない（ルートの vitest.config.ts と揃える）
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
