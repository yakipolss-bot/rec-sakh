import path from "path"
import react from "@vitejs/plugin-react"
import vike from "vike/plugin"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

export default defineConfig({
  base: '/',
  plugins: [
    process.env.NODE_ENV === 'development' ? inspectAttr() : null,
    react(),
    vike(),
  ].filter(Boolean),
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    noExternal: true,
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) return 'vendor';
          if (id.includes('node_modules/lucide-react/')) return 'icons';
          if (id.includes('node_modules/framer-motion/')) return 'animation';
        },
      },
    },
  },
});
