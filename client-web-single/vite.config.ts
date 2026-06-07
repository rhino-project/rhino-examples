import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Single-tenant client config.
//
//  - The /api proxy uses changeOrigin:true and targets the single-tenant Laravel
//    app on 127.0.0.1:8000. There are NO subdomains / orgs here, so no Host
//    preservation or X-Rhino-Host rewriting is needed.
//  - server.host:'0.0.0.0' + port 5174 so the dev server is reachable on the LAN.
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
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
