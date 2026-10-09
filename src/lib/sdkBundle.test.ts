import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isSdkBuildExternal } from "../../vite.externals";
import { THIRD_PARTY_LICENSE_BANNER } from "../../vite.banner";

describe("SDK ライブラリビルドの external 判定（isSdkBuildExternal）", () => {
  describe("正常系", () => {
    it("React 本体と jsx-runtime、絶対パスの cjs 実体を external にする", () => {
      expect(isSdkBuildExternal("react")).toBe(true);
      expect(isSdkBuildExternal("react/jsx-runtime")).toBe(true);
      expect(isSdkBuildExternal("react/jsx-dev-runtime")).toBe(true);
      expect(
        isSdkBuildExternal("/tmp/node_modules/react/cjs/react-jsx-runtime.production.min.js")
      ).toBe(true);
    });

    it("R3F / three を external にする", () => {
      expect(isSdkBuildExternal("@react-three/fiber")).toBe(true);
      expect(isSdkBuildExternal("@react-three/drei")).toBe(true);
      expect(isSdkBuildExternal("three")).toBe(true);
    });
  });

  describe("異常系", () => {
    it("SDK 自身の依存はバンドル対象のままにする", () => {
      expect(isSdkBuildExternal("@emotion/react")).toBe(false);
      expect(isSdkBuildExternal("@mui/material/colors")).toBe(false);
      expect(isSdkBuildExternal("chroma-js")).toBe(false);
    });

    it("pcd-viewer はバンドル対象にする", () => {
      expect(isSdkBuildExternal("@i-con/pcd-viewer")).toBe(false);
      expect(isSdkBuildExternal("@i-con/pcd-viewer/src/index.ts")).toBe(false);
    });
  });
});

describe("SDK の dist に React 内部 API を埋め込まない", () => {
  const es = readFileSync(resolve(process.cwd(), "dist/index.es.js"), "utf8");

  it("React 18 の jsx-runtime 内部（ReactCurrentDispatcher）を含まない", () => {
    expect(es).not.toContain("ReactCurrentDispatcher");
    expect(es).not.toContain("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED");
    expect(es).not.toContain("react-jsx-runtime.production.min.js");
  });

  it("jsx-runtime は import のまま残す", () => {
    expect(es).toContain('from "react/jsx-runtime"');
  });
});

describe("利用側に pcd-viewer のトランスパイル設定を要求しない", () => {
  const es = readFileSync(resolve(process.cwd(), "dist/index.es.js"), "utf8");

  it("実行時に pcd-viewer を import しない", () => {
    const imported = [...es.matchAll(/\bfrom "([^"]+)"/g)].map((m) => m[1]);
    expect(imported).not.toContain("@i-con/pcd-viewer");
  });

  it("同梱した pcd-viewer の MIT 表示を dist に残す", () => {
    expect(es).toContain(THIRD_PARTY_LICENSE_BANNER);
  });
});
