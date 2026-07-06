import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    port: 5195,
    proxy: {
      "/runner-api": { target: "http://localhost:3000", changeOrigin: true },
      "/api/v1": { target: "http://localhost:8003", changeOrigin: true },
      "/assets": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
