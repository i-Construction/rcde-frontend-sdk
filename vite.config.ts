import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
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
      entry: {
        index: "src/index.ts",
        "api-server": "src/api-server.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@react-three/fiber",
        "@react-three/drei",
        "three",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@react-three/fiber": "fiber",
          "@react-three/drei": "drei",
          three: "three",
        },
        banner: (chunk) => {
          if (chunk.isEntry && chunk.name === "index") return '"use client";';
          return "";
        },
      },
    },
  },
  publicDir: command === "build" ? false : "example/public", // for the example
}));
