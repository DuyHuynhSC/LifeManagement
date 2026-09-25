import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/entrade': {
        target: 'https://services.entrade.com.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/entrade/, '')
      },
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, '')
      }
    }
  }
});
