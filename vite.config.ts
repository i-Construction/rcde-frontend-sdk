import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { isSdkBuildExternal } from "./vite.externals";
import { THIRD_PARTY_LICENSE_BANNER } from "./vite.banner";

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
      output: {
        banner: THIRD_PARTY_LICENSE_BANNER,
      },
    },
  },
  publicDir: false,
}));
