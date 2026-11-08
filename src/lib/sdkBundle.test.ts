import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isSdkBuildExternal } from "../../vite.externals";
import { THIRD_PARTY_LICENSE_BANNER } from "../../vite.banner";
import { packageDirFromModuleId, THIRD_PARTY_LICENSES_FILE } from "../../vite.licenses";

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

    // サブパスが漏れると three の一部だけが dist に複製される（RAD2DEG で実際に起きていた）
    it("three のサブパスも external にする", () => {
      expect(isSdkBuildExternal("three/src/math/MathUtils.js")).toBe(true);
      expect(isSdkBuildExternal("three/addons/controls/OrbitControls.js")).toBe(true);
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

  // Vite がヘルパー関数を前に置くので、ファイルの先頭とは限らない
  it("第三者ソフトウェアのライセンスの置き場所を dist で案内する", () => {
    expect(es).toContain(THIRD_PARTY_LICENSE_BANNER);
  });
});

describe("利用側の型検査に pcd-viewer のソースを持ち込まない", () => {
  const dts = readFileSync(resolve(process.cwd(), "dist/index.d.ts"), "utf8");

  // pcd-viewer の types は TypeScript のソースを指しており、型定義が参照すると
  // 利用側がそのソースをコンパイルして pngjs/browser の型宣言不足で落ちる。
  // JSDoc でパッケージ名に触れるだけでは参照にならないので、import 指定子
  // （from '...' と import('...') の両方）だけを見る
  it("型定義から pcd-viewer を参照しない", () => {
    expect(dts).not.toMatch(/['"]@i-con\/pcd-viewer['"/]/);
  });

  // declare の有無は型定義を出力するプラグインの書き方次第なので問わない
  it("ContractFileView の meta に使う PointCloudMeta を公開する", () => {
    expect(dts).toMatch(/export (declare )?type PointCloudMeta\b/);
  });
});

describe("モジュール ID から同梱パッケージを特定する（packageDirFromModuleId）", () => {
  describe("正常系", () => {
    it("node_modules 直下のパッケージのディレクトリを返す", () => {
      expect(packageDirFromModuleId("/repo/node_modules/pngjs/browser.js")).toBe(
        "/repo/node_modules/pngjs"
      );
    });

    it("スコープ付きパッケージは @scope/name までをパッケージ名とする", () => {
      expect(packageDirFromModuleId("/repo/node_modules/@mui/material/Box/Box.js")).toBe(
        "/repo/node_modules/@mui/material"
      );
    });

    it("入れ子の node_modules は最も内側のパッケージを採る", () => {
      expect(
        packageDirFromModuleId("/repo/node_modules/prop-types/node_modules/react-is/index.js")
      ).toBe("/repo/node_modules/prop-types/node_modules/react-is");
    });

    it("仮想モジュールの \\0 と ? 以降のクエリを取り除く", () => {
      expect(
        packageDirFromModuleId("\0/repo/node_modules/object-assign/index.js?commonjs-module")
      ).toBe("/repo/node_modules/object-assign");
    });

    it("Windows のパス区切りでも判定する", () => {
      expect(packageDirFromModuleId("C:\\repo\\node_modules\\clsx\\dist\\clsx.mjs")).toBe(
        "C:/repo/node_modules/clsx"
      );
    });
  });

  describe("異常系", () => {
    it("SDK 自身のソースは同梱パッケージとして扱わない", () => {
      expect(packageDirFromModuleId("/repo/src/components/Viewer.tsx")).toBeUndefined();
    });
  });
});

describe("同梱した第三者パッケージのライセンスを配布物に含める", () => {
  const notices = readFileSync(resolve(process.cwd(), "dist", THIRD_PARTY_LICENSES_FILE), "utf8");
  const headings = [...notices.matchAll(/^(@?[^@\s]+)@\S+ \(/gm)].map((m) => m[1]);

  // 0.1.4 までは pcd-viewer 以外の著作権表示が dist に無かった
  it("主要な同梱パッケージの著作権表示とライセンス文を含む", () => {
    for (const name of [
      "@i-con/pcd-viewer",
      "pngjs",
      "chroma-js",
      "js-quadtree",
      "@mui/material",
      "@emotion/react",
      "prop-types",
    ]) {
      expect(headings).toContain(name);
    }
    expect(notices).toContain("Copyright (c) 2018 Corentin THOMASSET");
    expect(notices).toContain("Gregor Aisch");
  });

  it("pngjs の browser.js に内包されたモジュールのライセンス文を含む", () => {
    expect(notices).toContain("Modules embedded in pngjs/browser.js");
    for (const name of ["pako", "buffer", "ieee754", "readable-stream", "browserify-zlib"]) {
      expect(notices).toMatch(new RegExp(`^${name}@\\S+ \\(`, "m"));
    }
  });

  it("external にしたパッケージは同梱していないので載せない", () => {
    for (const name of ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"]) {
      expect(headings).not.toContain(name);
    }
  });
});
