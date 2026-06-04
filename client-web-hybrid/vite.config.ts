import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Hybrid (domain route groups) client config.
//
//  - server.host:true + allowedHosts ['.lvh.me'] so the dev server answers on
//    subdomains like acme.agency.lvh.me / globex.vendor.lvh.me / app.lvh.me.
//  - The /api proxy uses changeOrigin:FALSE on purpose: the original Host
//    (e.g. acme.agency.lvh.me) MUST be forwarded to the Laravel backend so its
//    Route::domain('{organization}.agency.lvh.me') matching picks the right
//    route group AND organization. changeOrigin:true would rewrite Host to the
//    target (127.0.0.1) and break domain routing.
//  - resolve.dedupe + explicit react/react-dom aliases force a SINGLE copy of
//    React even though @rhino-dev/rhino-react is a file:-linked package — this
//    avoids the duplicate-React "Invalid hook call" pitfall.
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: {
      react: r('./node_modules/react'),
      'react-dom': r('./node_modules/react-dom'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.lvh.me'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: false,
      },
    },
  },
});
