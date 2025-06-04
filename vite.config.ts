import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Configurações para PWA
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Service Worker deve estar na raiz
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "sw.js") {
            return "sw.js";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  // Configurações para desenvolvimento PWA
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  // Configurar assets públicos
  publicDir: "public",
}));
