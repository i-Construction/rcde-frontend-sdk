// eslint-config-next 16 は flat config の配列をそのまま export するため、
// FlatCompat（eslintrc 互換レイヤー）は使わない。compat 経由で読み込むと
// プラグイン定義の循環参照でスキーマ検証が落ちる。
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
