import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { fixPcdViewerReact } from "./vite/fix-pcd-viewer-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    fixPcdViewerReact(),
    react({}),
    dts({
      tsconfigPath: "./tsconfig.json",
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "rcde-frontend-sdk",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-reconciler",
        "scheduler",
        "@react-three/fiber",
        "@react-three/drei",
        "three",
        "pngjs",
        "pngjs/browser",
        /^@mui\/.*/,
        /^@emotion\/.*/,
        /^@xstate\/.*/,
        /^xstate$/,
        /^use-sync-external-store/,
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@react-three/fiber": "fiber",
          "@react-three/drei": "drei",
          three: "three",
        },
        banner: '"use client";',
      },
    },
  },
  publicDir: command === "build" ? false : "example/public",
}));
