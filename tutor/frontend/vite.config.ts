import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      "/api": { target: "http://localhost:8001", changeOrigin: true, ws: true },
      "/media": { target: "http://localhost:8001", changeOrigin: true },
      "/health": { target: "http://localhost:8001", changeOrigin: true },
    },
  },
});
