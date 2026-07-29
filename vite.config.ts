import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx', './src/pages/Index.tsx'],
    },
    proxy: {
      '/__l5e': {
        target: 'https://id-preview--ea8832c0-5f30-4d47-a611-9a3021cb2360.lovable.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'recharts',
      'mapbox-gl',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'html2pdf.js',
      'jspdf',
      'html2canvas',
      'date-fns',
      'zod',
      'zustand',
      'sonner',
      'next-themes',
      'react-hook-form',
      'react-markdown',
      'embla-carousel-react',
      'vaul',
      'cmdk',
      'dompurify',
      'papaparse',
      'xlsx',
      'qrcode.react',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(new Date().toISOString()),
  },
  publicDir: 'public',
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep PDF worker in root for easy access
          if (assetInfo.name === 'pdf.worker.min.js') {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // NOTE: no custom manualChunks. Hand-rolled vendor grouping created
        // circular chunk dependencies (TDZ "Cannot access X before
        // initialization"), which produced a white screen on first load.
        // Rollup's default chunking keeps module init order correct.

      }
    }
  },
}));
