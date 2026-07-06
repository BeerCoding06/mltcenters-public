import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/runner-api": { target: "http://localhost:3000", changeOrigin: true },
      "/runner-app": { target: "http://localhost:5195", changeOrigin: true, rewrite: (p) => p.replace(/^\/runner-app/, "") || "/" },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
