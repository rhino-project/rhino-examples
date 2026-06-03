import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — proxies /api to the Laravel server so the rhino-react
// default `baseURL: '/api'` works without CORS in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
