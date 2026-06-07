import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, configureApi } from '@rhino-dev/rhino-react';

import { App } from './App';
import { ToastProvider } from './components/Toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

// The auth token persists across reloads (localStorage), so refreshing keeps
// you signed in. A genuinely invalid/expired token is cleared on its first 401
// (the axios interceptor + onUnauthorized below), dropping you back to login.

// Configure the rhino-react API client ONCE at startup.
//   - baseURL '/api' goes through the vite proxy (changeOrigin:true → 127.0.0.1:8000).
//     This is a SINGLE-TENANT backend: no orgs, no subdomains, no Host trickery.
//   - tenancy:'subdomain' tells the stock data hooks the org is NOT carried in the
//     URL path, so they build /api/{model} with NO org segment (e.g. /api/projects).
//     (We never call setOrganization, so there is no org to put in the path anyway.)
//   - onUnauthorized: the axios interceptor already cleared the stored token on a
//     401; we just broadcast it so the app drops back to the login screen instead
//     of doing the default window.location reload (which would loop).
configureApi({
  baseURL: '/api',
  tenancy: 'subdomain',
  onUnauthorized: () => {
    window.dispatchEvent(new CustomEvent('rhino:unauthorized'));
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
