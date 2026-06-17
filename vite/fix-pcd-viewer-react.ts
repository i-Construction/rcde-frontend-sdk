import type { Plugin } from "vite";

/**
 * @i-con/pcd-viewer の dist は react-jsx-runtime を同梱しており、
 * Next.js では React の __SECRET_INTERNALS 参照が壊れて ReactCurrentOwner 等のエラーになる。
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
        /^import \w+, (\{[^}]+\}) from "react";/m,
        "import $1 from \"react\";"
      );

      const startMatch = fixedImport.match(
        /var (\w+) = \{ exports: \{\} \}, (\w+) = \{\};\n\/\*\*\n \* @license React\n \* react-jsx-runtime\.production/
      );
      if (!startMatch) {
        this.warn(
          "fix-pcd-viewer-react: jsx-runtime block not found, skipping"
        );
        return null;
      }

      const exportsVar = startMatch[1];
      const startIdx = startMatch.index!;
      const endPattern = new RegExp(
        'process\\.env\\.NODE_ENV === "production" \\? ' +
          exportsVar +
          '\\.exports = \\w+\\(\\) : ' +
          exportsVar +
          '\\.exports = \\w+\\(\\);\\nvar ([$\\w]+) = ' +
          exportsVar +
          '\\.exports;'
      );
      const endMatch = fixedImport.slice(startIdx).match(endPattern);
      if (!endMatch) {
        this.warn(
          "fix-pcd-viewer-react: jsx-runtime block end not found, skipping"
        );
        return null;
      }

      const exportName = endMatch[1];
      const endIdx = startIdx + endMatch.index! + endMatch[0].length;

      const replacement = `import { jsx as __pcd_jsx, jsxs as __pcd_jsxs, Fragment as __pcd_Frag } from "react/jsx-runtime";
var ${exportName} = { jsx: __pcd_jsx, jsxs: __pcd_jsxs, Fragment: __pcd_Frag };`;

      const patched =
        fixedImport.slice(0, startIdx) +
        replacement +
        fixedImport.slice(endIdx);

      return { code: patched, map: null };
    },
  };
}
