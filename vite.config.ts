import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = env.VITE_API_PORT || "3001";

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      "/api": { target: `http://localhost:${apiPort}`, changeOrigin: true },
      "/runner-api": { target: `http://localhost:${apiPort}`, changeOrigin: true },
      "/runner-app": { target: `http://localhost:${apiPort}`, changeOrigin: true },
    },
  },
  plugins: [
    react(),
    {
      name: "inject-gsc-verification",
      transformIndexHtml(html) {
        const code = env.VITE_GSC_VERIFICATION?.trim();
        if (!code) return html;
        const tag = `<meta name="google-site-verification" content="${code}" />`;
        return html.includes("google-site-verification")
          ? html
          : html.replace("</head>", `    ${tag}\n  </head>`);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@fontsource")) return "fonts";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
};
});
