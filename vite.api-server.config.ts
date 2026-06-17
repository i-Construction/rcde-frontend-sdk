import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/api-server.ts",
      fileName: () => "api-server.es.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@react-three/fiber",
        "@react-three/drei",
        "three",
      ],
    },
    emptyOutDir: false,
  },
});
