import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    proxy: {
      "/api": { target: "http://localhost:8002", changeOrigin: true },
      "/health": { target: "http://localhost:8002", changeOrigin: true },
    },
  },
});
