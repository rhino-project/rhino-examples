import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, configureApi } from '@rhino-dev/rhino-react';

import { App } from './App';
import { GroupProvider } from './groups/GroupContext';
import { ToastProvider } from './components/Toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setForbidden } from './lib/forbidden';
import './styles.css';

// Configure the rhino-react API client ONCE at startup.
//   - baseURL '/api' goes through the vite proxy (changeOrigin:false). The proxy
//     reads the per-request X-Rhino-Host header (set by GroupContext from the
//     active face) and rewrites the upstream Host, so the chosen group's host
//     reaches Laravel's domain routing — even on plain localhost:5173.
//   - tenancy:'subdomain' tells the stock data hooks the org is carried by the
//     request HOST, so they build /api/{model} with NO org path segment.
//   - No routeGroup: the groups here are domain-scoped (the Host carries group +
//     org), so auth stays at /api/auth/* and data at /api/{model} — no prefix.
//   - onForbidden surfaces the design's 403 "not a member of this group"; the
//     face-specific wording is built by the Login/Workspace views.
configureApi({
  baseURL: '/api',
  tenancy: 'subdomain',
  onForbidden: () => {
    setForbidden(
      "You're not a member of this group. (membership enforcement is ON for this backend.)",
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
        <GroupProvider>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </GroupProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
