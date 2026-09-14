import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: false },
  // From Balaji's map fix: Vite's dev dependency optimizer can omit the
  // MapLibre worker chunk. Let MapLibre resolve its worker directly.
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
