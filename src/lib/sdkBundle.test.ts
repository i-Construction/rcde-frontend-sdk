import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isSdkBuildExternal } from "../../vite.externals";
import { THIRD_PARTY_LICENSE_BANNER } from "../../vite.banner";
import {
  type LicenseEntry,
  packageDirFromModuleId,
  readLicenseEntry,
  supplementVersionError,
  THIRD_PARTY_LICENSES_FILE,
} from "../../vite.licenses";

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

describe("同梱パッケージのライセンス情報を読む（readLicenseEntry）", () => {
  let dir: string;

  function makePackage(pkg: Record<string, unknown>, files: Record<string, string> = {}) {
    dir = mkdtempSync(join(tmpdir(), "rcde-license-"));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0", ...pkg })
    );
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    return dir;
  }

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  describe("正常系", () => {
    it("license 欄とライセンスファイルの本文を読む", () => {
      const entry = readLicenseEntry(makePackage({ license: "MIT" }, { LICENSE: "Copyright X\n" }));
      expect(entry).toEqual({
        name: "fixture",
        version: "1.0.0",
        license: "MIT",
        text: "Copyright X",
      });
    });

    // REUSE 準拠のパッケージは LICENSES/ ディレクトリを持つことがある
    it("ライセンスらしい名前のディレクトリは読まずにファイルだけを読む", () => {
      makePackage({ license: "MIT" }, { LICENSE: "Copyright X" });
      mkdirSync(join(dir, "LICENSES"));
      expect(readLicenseEntry(dir)).toMatchObject({ text: "Copyright X" });
    });
  });

  describe("異常系", () => {
    it("licenses が空の配列なら UNKNOWN とする", () => {
      const entry = readLicenseEntry(makePackage({ licenses: [] }, { LICENSE: "Copyright X" }));
      expect(entry).toMatchObject({ license: "UNKNOWN" });
    });

    it("ライセンスファイルが無ければ、パッケージ名と版を含むエラー文を返す", () => {
      makePackage({ license: "MIT" });
      mkdirSync(join(dir, "LICENSES"));
      expect(readLicenseEntry(dir)).toContain("fixture@1.0.0 にライセンスファイルがありません");
    });
  });
});

describe("補足ライセンスの版を確かめる（supplementVersionError）", () => {
  const entry = (name: string, version: string): LicenseEntry => ({
    name,
    version,
    license: "MIT",
    text: "",
  });

  describe("正常系", () => {
    it("確かめた版と同じなら通す", () => {
      expect(supplementVersionError(entry("pngjs", "7.0.0"))).toBeUndefined();
    });

    it("補足の無いパッケージは版を問わない", () => {
      expect(supplementVersionError(entry("clsx", "9.9.9"))).toBeUndefined();
    });
  });

  describe("異常系", () => {
    // browser.js が作り直されると内包モジュールが変わりうるので、古い一覧を配布しない
    it("確かめた版と違えばビルドを止めるエラー文を返す", () => {
      expect(supplementVersionError(entry("pngjs", "7.1.0"))).toContain(
        "pngjs@7.1.0 は補足ライセンス（7.0.0 で確認）と版が異なります"
      );
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

describe("pngjs の補足ライセンスが browser.js の内包モジュールと一致する", () => {
  const browserJs = readFileSync(resolve(process.cwd(), "node_modules/pngjs/browser.js"), "utf8");
  const supplement = readFileSync(
    resolve(process.cwd(), "licenses/pngjs-browser-embedded.txt"),
    "utf8"
  );

  // browserify は各モジュールの後ろに {"require した名前":番号} の依存表を置く。
  // 組み込みモジュールは browserify の別名で現れるので、配布元のパッケージ名に直す。
  // dup は重複を省いた印で、パッケージではない
  const BROWSERIFY_ALIASES: Record<string, string> = {
    _process: "process",
    stream: "stream-browserify",
    zlib: "browserify-zlib",
  };
  const embedded = new Set<string>();
  for (const table of browserJs.matchAll(/\},\{((?:"[^"]+":\d+,?)*)\}\]/g)) {
    for (const [, specifier] of table[1].matchAll(/"([^"]+)":\d+/g)) {
      if (specifier.startsWith(".") || specifier === "dup") continue;
      const [first, second] = specifier.split("/");
      const name = first.startsWith("@") ? `${first}/${second}` : first;
      embedded.add(BROWSERIFY_ALIASES[name] ?? name);
    }
  }
  const listed = [...supplement.matchAll(/^(@?[^@\s]+)@\d\S* \(/gm)].map((m) => m[1]);

  // 依存の入れ直しでは現れない古い版の内包モジュール（call-bind）が漏れていた
  it("browser.js が require するパッケージを過不足なく載せる", () => {
    expect(embedded.size).toBeGreaterThan(0);
    expect([...listed].sort()).toEqual([...embedded].sort());
  });
});
