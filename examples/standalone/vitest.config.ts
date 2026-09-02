import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// example-poc の純粋ロジック向けユニットテスト設定。
// next/headers や SDK クライアントは各テスト内で vi.mock する。
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // next.config.js の webpack alias と揃える。
      // 揃えないと vitest だけ node_modules 経由でルートの exports → dist を見に行き、
      // CI（dist を作らない）で解決エラーになる。
      "@i-con/frontend-sdk": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    // コンポーネントテストを書く場合は jsdom / happy-dom への切り替えを検討する
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // テストがまだ無い状態でも CI を落とさない（ルートの vitest.config.ts と揃える）
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
