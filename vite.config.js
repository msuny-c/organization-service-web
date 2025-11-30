import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:35000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:35000',
        ws: true,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
