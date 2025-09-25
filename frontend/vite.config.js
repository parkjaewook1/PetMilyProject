import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import * as dotenv from "dotenv";

dotenv.config();
const targetServer = process.env.TARGET_SERVER || "localhost";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ws": {
        target: `http://${targetServer}:8080`,
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        target: `http://${targetServer}:8080`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      global: "global/auto",
      "@api": "/src/api", // ✅ src/api 폴더를 @api로 지정
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
});
