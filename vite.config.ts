import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { creationStatsPlugin } from "./scripts/creation-stats";

// Article videos live in the separate largeFiles repository, published at /largeFiles/.
// Local development and preview read the published copy.
const mediaProxy = { "/largeFiles": { target: "https://fanyu-meng.github.io", changeOrigin: true } };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // GitHub Pages base path (use "/repository-name/" if not using username.github.io)
  server: {
    host: "::",
    port: 8080,
    proxy: mediaProxy,
  },
  preview: {
    proxy: mediaProxy,
  },
  plugins: [react(), creationStatsPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
