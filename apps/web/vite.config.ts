import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  css: { postcss: { plugins: [] } },
  server: { port: 5173, strictPort: false, host: true },
  // Vite 7's dep optimizer (esbuild pre-bundling) fails to emit maplibre-gl's web
  // worker chunk, so the map never constructs on the DEV server (production `vite build`
  // via Rollup is unaffected). Excluding it lets MapLibre resolve its own worker.
  // Safe here because the app imports maplibre-gl only for types + CSS; the runtime
  // value import comes through react-map-gl/maplibre.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl', 'react-map-gl/maplibre'],
          echarts: ['echarts', 'echarts-for-react'],
          firebase: ['firebase/app', 'firebase/auth'],
        },
      },
    },
  },
});

