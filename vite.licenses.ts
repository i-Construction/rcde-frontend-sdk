import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/**
 * dist に同梱した第三者パッケージのライセンスを書き出すファイル名。
 * package.json の files に dist が入っているので、npm の配布物にも含まれる。
 */
export const THIRD_PARTY_LICENSES_FILE = "THIRD_PARTY_LICENSES.txt";

/**
 * 同梱したパッケージのうち、内部に別のパッケージを埋め込んでいて、そのライセンス文が
 * パッケージ自身に入っていないもの。補足のライセンス文を、そのパッケージの項に続けて出す。
 *
 * pngjs の browser.js は browserify でまとめたファイルで、Node.js 互換のモジュールを
 * 29 個内包している。ビルドのモジュール一覧には pngjs としか現れないため、自動では拾えない。
 *
 * パスはこのファイルからの相対で解決する。作業ディレクトリ基準にすると、リポジトリ直下
 * 以外から Vite を起動したときに見つからなくなる。
 */
const SUPPLEMENTARY_LICENSES: Record<string, string> = {
  pngjs: fileURLToPath(new URL("./licenses/pngjs-browser-embedded.txt", import.meta.url)),
};

const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying|notice)/i;

/**
 * Rollup のモジュール ID から、そのモジュールを含むパッケージのディレクトリを返す。
 * node_modules の外（SDK 自身のソース）なら undefined。
 *
 * 入れ子の node_modules は最も内側のパッケージを採る。仮想モジュールの先頭の \0 と、
 * CommonJS 変換などで付く ?以降のクエリは取り除く。
 */
export function packageDirFromModuleId(id: string): string | undefined {
  const normalized = id.replace(/\0/g, "").replace(/\?.*$/, "").replace(/\\/g, "/");
  const marker = "/node_modules/";
  const index = normalized.lastIndexOf(marker);
  if (index < 0) return undefined;

  const [first, second] = normalized.slice(index + marker.length).split("/");
  if (!first) return undefined;
  const name = first.startsWith("@") && second ? `${first}/${second}` : first;
  return normalized.slice(0, index + marker.length) + name;
}

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  text: string;
};

function readLicenseEntry(dir: string): LicenseEntry | string {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    name: string;
    version: string;
    license?: string | { type?: string };
    licenses?: { type?: string }[];
  };
  const license =
    typeof pkg.license === "string"
      ? pkg.license
      : (pkg.license?.type ?? pkg.licenses?.map((l) => l.type).join(" OR ") ?? "UNKNOWN");

  const files = readdirSync(dir)
    .filter((file) => LICENSE_FILE_PATTERN.test(file))
    .sort();
  if (files.length === 0) {
    return `${pkg.name}@${pkg.version} にライセンスファイルがありません（${dir}）`;
  }
  const text = files.map((file) => readFileSync(join(dir, file), "utf8").trim()).join("\n\n");
  return { name: pkg.name, version: pkg.version, license, text };
}

/** SPDX の複合式（"(MIT AND Zlib)" など）は元から括弧付きなので、二重に囲まない */
function formatHeading(entry: LicenseEntry): string {
  const license = /^\(.*\)$/.test(entry.license) ? entry.license : `(${entry.license})`;
  return `${entry.name}@${entry.version} ${license}`;
}

function formatLicenses(entries: LicenseEntry[]): string {
  const rule = "=".repeat(80);
  const lines = [
    "Third-party software bundled in @i-con/frontend-sdk",
    "",
    "dist/index.es.js includes code from the packages listed below. Their copyright",
    "notices and license texts are reproduced in this file.",
    "",
    ...entries.map((e) => `- ${formatHeading(e)}`),
    "",
  ];
  for (const entry of entries) {
    lines.push(rule, formatHeading(entry), rule, "", entry.text, "");
    const supplement = SUPPLEMENTARY_LICENSES[entry.name];
    if (supplement !== undefined) {
      lines.push(readFileSync(supplement, "utf8").trim(), "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

/**
 * dist に同梱したパッケージのライセンス文を集め、THIRD_PARTY_LICENSES.txt として出力する。
 *
 * 同梱の有無はビルド結果のモジュール一覧から判断する。tree shaking で 1 バイトも残らなかった
 * モジュールは数えない。external にしたもの（React / Three.js など）はここに現れない。
 * ライセンスファイルを持たないパッケージが同梱されたら、表示が漏れないようビルドを止める。
 */
export function thirdPartyLicenses(): Plugin {
  return {
    name: "rcde-third-party-licenses",
    apply: "build",
    generateBundle(_options, bundle) {
      const dirs = new Set<string>();
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const [id, info] of Object.entries(output.modules)) {
          if (info.renderedLength === 0) continue;
          const dir = packageDirFromModuleId(id);
          if (dir !== undefined) dirs.add(dir);
        }
      }

      const byKey = new Map<string, LicenseEntry>();
      for (const dir of dirs) {
        const entry = readLicenseEntry(dir);
        if (typeof entry === "string") this.error(entry);
        byKey.set(`${entry.name}@${entry.version}`, entry);
      }
      const entries = [...byKey.values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
      );

      this.emitFile({
        type: "asset",
        fileName: THIRD_PARTY_LICENSES_FILE,
        source: formatLicenses(entries),
      });
    },
  };
}
