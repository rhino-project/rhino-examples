import { fileURLToPath } from 'node:url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// `@rhino-dev/rhino-react` ships ESM. We BUNDLE its tiny electron helpers into
// the CJS main/preload outputs (rather than externalizing) to avoid any
// ESM-require friction at runtime — they have no third-party deps.
const RHINO = '@rhino-dev/rhino-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: [RHINO] })],
    build: {
      rollupOptions: { input: r('src/main/index.ts') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: [RHINO] })],
    build: {
      rollupOptions: { input: r('src/preload/index.ts') },
    },
  },
  renderer: {
    root: '.',
    plugins: [react()],
    // file:-linked rhino-react would otherwise pull a second copy of React —
    // dedupe + explicit aliases force a single instance (avoids "Invalid hook call").
    resolve: {
      dedupe: ['react', 'react-dom', '@tanstack/react-query'],
      alias: {
        react: r('node_modules/react'),
        'react-dom': r('node_modules/react-dom'),
      },
    },
    build: {
      rollupOptions: { input: r('index.html') },
    },
    server: {
      // Dev only: proxy /api to the single-tenant Laravel server so the renderer
      // calls relative URLs (no CORS). A packaged build would instead use an
      // absolute baseURL (and ideally a main-process transport).
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
  },
});
