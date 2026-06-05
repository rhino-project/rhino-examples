import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Hybrid (domain route groups) client config.
//
//  - server.host:true + allowedHosts ['.lvh.me'] so the dev server answers on
//    subdomains like acme.agency.lvh.me / globex.vendor.lvh.me / app.lvh.me.
//  - The /api proxy uses changeOrigin:FALSE on purpose and rewrites the upstream
//    Host from the per-request X-Rhino-Host header (set by the app's active
//    face). This lets the picker drive Laravel's
//    Route::domain('{organization}.agency.lvh.me') group + org routing even on
//    plain localhost:5173. When already on a real *.lvh.me subdomain the header
//    just mirrors that Host. changeOrigin:true would rewrite Host to the target
//    (127.0.0.1) and break domain routing.
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
        configure: (proxy) =>
          proxy.on('proxyReq', (pr, req) => {
            const h = req.headers['x-rhino-host'];
            if (h) pr.setHeader('Host', String(h));
          }),
      },
    },
  },
});
