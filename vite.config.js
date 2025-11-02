import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isProd = process.env.NODE_ENV === "production";

// 🧩 Backend targets
const LOCAL_API = "http://localhost:4000";
const PROD_API = "https://audio-merge-api-07vx.onrender.com";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: isProd
      ? {} // no proxy needed in production (handled by Vercel rewrite)
      : {
          "/api": {
            target: LOCAL_API,
            changeOrigin: true,
            secure: false
          },
          "/auth": {
            target: LOCAL_API,
            changeOrigin: true,
            secure: false
          }
        }
  },
  define: {
    __API_URL__: JSON.stringify(isProd ? PROD_API : LOCAL_API)
  }
});
