#!/usr/bin/env node
/**
 * vitest テストファイルから describe / it / test を静的抽出し、
 * docs/TEST_CASES.md を生成する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(ROOT, "docs", "TEST_CASES.md");
const SEARCH_ROOTS = ["src", path.join("example-poc", "src")];

const TEST_CALL_NAMES = new Set(["describe", "it", "test"]);
const MODIFIER_LABELS = {
  skip: "skip",
  todo: "todo",
  only: "only",
};

/** ディレクトリ配下の *.test.ts を再帰収集 */
function collectTestFiles(dir) {
  const absoluteDir = path.join(ROOT, dir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(path.relative(ROOT, entryPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(path.relative(ROOT, entryPath));
    }
  }
  return files.sort();
}

/** CallExpression の callee からテスト関数名と修飾子を取得 */
function parseTestCallee(callee) {
  if (ts.isIdentifier(callee)) {
    const name = callee.text;
    if (!TEST_CALL_NAMES.has(name)) {
      return null;
    }
    return { name, modifier: null };
  }

  if (!ts.isPropertyAccessExpression(callee)) {
    return null;
  }

  const modifier = callee.name.text;
  if (!(modifier in MODIFIER_LABELS)) {
    return null;
  }

  const base = callee.expression;
  if (ts.isIdentifier(base)) {
    const name = base.text;
    if (!TEST_CALL_NAMES.has(name)) {
      return null;
    }
    return { name, modifier };
  }

  if (
    ts.isPropertyAccessExpression(base) &&
    ts.isIdentifier(base.expression) &&
    base.name.text === "each"
  ) {
    const name = base.expression.text;
    if (!TEST_CALL_NAMES.has(name)) {
      return null;
    }
    return { name, modifier: modifier === "each" ? null : modifier };
  }

  return null;
}

/** 文字列リテラル / テンプレートリテラルをプレーン文字列に変換 */
function extractTitle(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (ts.isTemplateExpression(expression)) {
    let text = expression.head.text;
    for (const span of expression.templateSpans) {
      text += "${...}";
      text += span.literal.text;
    }
    return text;
  }

  return null;
}

/** describe / it / test の CallExpression からノード情報を取得 */
function parseTestCall(node) {
  const parsed = parseTestCallee(node.expression);
  if (!parsed) {
    return null;
  }

  const firstArg = node.arguments[0];
  if (!firstArg) {
    return null;
  }

  const title = extractTitle(firstArg);
  if (title === null) {
    return null;
  }

  return {
    kind: parsed.name === "describe" ? "describe" : "case",
    title,
    modifier: parsed.modifier,
  };
}

/** ソースファイルから describe ツリーとケース一覧を構築 */
function parseTestFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const sourceText = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const root = { title: null, describes: [], cases: [] };
  const stack = [root];
  let caseCount = 0;

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const testCall = parseTestCall(node);
      if (testCall) {
        if (testCall.kind === "describe") {
          const block = {
            title: testCall.title,
            modifier: testCall.modifier,
            describes: [],
            cases: [],
          };
          stack[stack.length - 1].describes.push(block);
          stack.push(block);
          ts.forEachChild(node.arguments[1], visit);
          stack.pop();
          return;
        }

        stack[stack.length - 1].cases.push({
          title: testCall.title,
          modifier: testCall.modifier,
        });
        caseCount += 1;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { file: relativePath, root, caseCount };
}

function formatModifier(modifier) {
  if (!modifier) {
    return "";
  }
  const label = MODIFIER_LABELS[modifier] ?? modifier;
  return ` (${label})`;
}

/** テーブルセル内のパイプをエスケープ */
function escapeTableCell(text) {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** describe ツリーからフラットな行一覧を収集 */
function collectCaseRows(block, pathParts, rows) {
  const currentPath =
    block.title !== null
      ? [...pathParts, `${block.title}${formatModifier(block.modifier)}`]
      : pathParts;

  for (const testCase of block.cases) {
    rows.push({
      group: currentPath.length > 0 ? currentPath.join(" › ") : "—",
      title: testCase.title,
      note: testCase.modifier
        ? (MODIFIER_LABELS[testCase.modifier] ?? testCase.modifier)
        : "",
    });
  }

  for (const child of block.describes) {
    collectCaseRows(child, currentPath, rows);
  }
}

function renderCaseTable(rows) {
  const lines = [
    "| # | グループ | テストケース | 備考 |",
    "|--:|---|---|---|",
  ];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const number = index + 1;
    lines.push(
      `| ${number} | ${escapeTableCell(row.group)} | ${escapeTableCell(row.title)} | ${escapeTableCell(row.note)} |`
    );
  }

  return lines;
}

function renderSummaryTable(fileResults) {
  const lines = [
    "| ファイル | ケース数 |",
    "|---|--:|",
  ];

  for (const result of fileResults) {
    lines.push(`| \`${result.file}\` | ${result.caseCount} |`);
  }

  const totalCases = fileResults.reduce((sum, result) => sum + result.caseCount, 0);
  lines.push(`| **合計** | **${totalCases}** |`);
  return lines;
}

function renderFileSection(parsed) {
  const rows = [];
  collectCaseRows(parsed.root, [], rows);

  const lines = [`## ${parsed.file}`, ""];
  lines.push(...renderCaseTable(rows));
  lines.push("");
  return lines;
}

function buildMarkdown(fileResults) {
  const totalCases = fileResults.reduce((sum, result) => sum + result.caseCount, 0);
  const lines = [
    "# テストケース一覧",
    "",
    "> 自動生成: `npm run test:cases`（手動編集しないでください）",
    "",
    `合計: ${fileResults.length} ファイル / ${totalCases} テストケース`,
    "",
    "## サマリー",
    "",
    ...renderSummaryTable(fileResults),
    "",
  ];

  for (const result of fileResults) {
    lines.push(...renderFileSection(result));
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function main() {
  const testFiles = SEARCH_ROOTS.flatMap((dir) => collectTestFiles(dir));
  const fileResults = testFiles.map((file) => parseTestFile(file));
  const markdown = buildMarkdown(fileResults);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");

  const totalCases = fileResults.reduce((sum, result) => sum + result.caseCount, 0);
  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`${fileResults.length} files, ${totalCases} test cases`);
}

main();
