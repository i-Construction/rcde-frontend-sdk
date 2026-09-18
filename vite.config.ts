import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { isSdkBuildExternal } from "./vite.externals";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
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
      external: isSdkBuildExternal,
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "react/jsx-dev-runtime": "jsxDevRuntime",
          "@react-three/fiber": "fiber",
          "@react-three/drei": "drei",
          "@i-con/pcd-viewer": "pcdViewer",
          three: "three",
        },
      },
    },
  },
  publicDir: false,
}));
