/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "roshooks",
      fileName: (format) => (format === "es" ? "roshooks.js" : "roshooks.cjs"),
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "roslib"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          roslib: "ROSLIB",
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
