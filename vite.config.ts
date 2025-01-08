import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react({}),
    dts({
      tsconfigPath: "./tsconfig.json",
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
      },
    },
  },
  publicDir: command === "build" ? false : "example/public", // for the example
}));
