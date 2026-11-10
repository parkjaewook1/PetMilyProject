import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import * as dotenv from "dotenv";

dotenv.config();
const targetServer = process.env.TARGET_SERVER || "localhost";

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: "petmily-map-sdk-config",
    transformIndexHtml() {
      const key = loadEnv(mode, process.cwd(), "VITE_").VITE_KAKAO_MAP_JAVASCRIPT_KEY;
      if (!key) return [];
      return [{
        tag: "script",
        attrs: { type: "text/javascript", src: `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services,clusterer,drawing` },
        injectTo: "head",
      }];
    },
  }],
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
}));
