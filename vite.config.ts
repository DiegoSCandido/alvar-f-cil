import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("node_modules/react-router-dom")) {
            return "router";
          }

          if (id.includes("node_modules/@tanstack/react-query")) {
            return "query";
          }

          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform/resolvers") ||
            id.includes("node_modules/zod")
          ) {
            return "forms";
          }

          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3")
          ) {
            return "charts";
          }

          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/react-day-picker") ||
            id.includes("node_modules/embla-carousel-react")
          ) {
            return "ui-kit";
          }

          if (
            id.includes("node_modules/date-fns") ||
            id.includes("node_modules/axios")
          ) {
            return "utils";
          }

          return "vendor";
        },
      },
    },
  },
}));
