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
      fileName: () => "index.es.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: isSdkBuildExternal,
    },
  },
  publicDir: false,
}));
