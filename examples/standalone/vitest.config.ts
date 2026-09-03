import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// examples/standalone の純粋ロジック向けユニットテスト設定。
// next/headers や SDK クライアントは各テスト内で vi.mock する。
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // next.config.js の webpack alias と揃える。
      // 揃えないと vitest だけ node_modules 経由でルートの exports → dist を見に行き、
      // CI（dist を作らない）で解決エラーになる。
      "@i-con/frontend-sdk": fileURLToPath(new URL("../../src", import.meta.url)),
      // SDK ソースの bare import はルートの node_modules（React 18 / fiber 8）へ上がり、
      // テスト側の React 19 と混ざって Invalid hook call になる。
      // コンポーネントテストを追加するときは next.config.js の dedupe alias
      // （react / react-dom / @react-three/*）をここへ移す。
    },
  },
  test: {
    globals: true,
    // node は純粋ロジック向け。コンポーネントテストには jsdom / happy-dom が要る
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // テストが 0 件でも CI を落とさない（ルートの vitest.config.ts と揃える）
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
