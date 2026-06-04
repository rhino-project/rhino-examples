import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, configureApi } from '@rhino-dev/rhino-react';

import { App } from './App';
import { ToastProvider } from './components/Toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setForbidden } from './lib/forbidden';
import { detectGroup } from './lib/group';
import './styles.css';

// Configure the rhino-react API client ONCE at startup.
//   - baseURL '/api' goes through the vite proxy (changeOrigin:false) so the
//     subdomain Host reaches the Laravel backend's domain routing.
//   - tenancy:'subdomain' tells the stock data hooks the org is carried by the
//     request HOST, so they build /api/{model} with NO org path segment —
//     exactly what these domain-scoped groups need.
//   - We deliberately DO NOT pass a routeGroup: the groups here are domain-
//     scoped (the Host carries group + org), so auth stays at /api/auth/* and
//     data stays at /api/projects — no path prefix.
//   - onForbidden surfaces the design's 403 "not a member of this group".
const detected = detectGroup();
configureApi({
  baseURL: '/api',
  tenancy: 'subdomain',
  onForbidden: () => {
    setForbidden(
      `You're not a member of the ${detected.group} group` +
        (detected.org ? ` for "${detected.org}".` : '.'),
    );
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
