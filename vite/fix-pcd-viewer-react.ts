import type { Plugin } from "vite";

const JSX_RUNTIME_START = "var Ht = { exports: {} }, _t = {};";
const JSX_RUNTIME_END = "var qe = Ht.exports;";

/**
 * pcd-viewer の dist は react-jsx-runtime を同梱しており、
 * Next.js (Turbopack) では React の default import が壊れて ReactCurrentOwner エラーになる。
 * 同梱ランタイムを react/jsx-runtime の import に差し替える。
 */
export function fixPcdViewerReact(): Plugin {
  return {
    name: "fix-pcd-viewer-react",
    transform(code, id) {
      if (!id.includes("pcd-viewer/dist/index.es.js")) {
        return null;
      }

      const fixedImport = code.replace(
        /import hr, (\{[^}]+\}) from "react";/,
        "import $1 from \"react\";"
      );

      const start = fixedImport.indexOf(JSX_RUNTIME_START);
      const end = fixedImport.indexOf(JSX_RUNTIME_END);
      if (start === -1 || end === -1) {
        this.warn("fix-pcd-viewer-react: jsx-runtime block not found, skipping");
        return null;
      }

      const replacement = `import { jsx as __pcd_jsx, jsxs as __pcd_jsxs, Fragment as __pcd_Frag } from "react/jsx-runtime";
const qe = { jsx: __pcd_jsx, jsxs: __pcd_jsxs, Fragment: __pcd_Frag };`;

      const patched =
        fixedImport.slice(0, start) +
        replacement +
        fixedImport.slice(end + JSX_RUNTIME_END.length);

      return { code: patched, map: null };
    },
  };
}
