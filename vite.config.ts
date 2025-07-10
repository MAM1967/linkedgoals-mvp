import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    envDir: "./",
    envPrefix: "VITE_",
  };
});
