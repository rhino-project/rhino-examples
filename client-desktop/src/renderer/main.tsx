import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, configureApi } from '@rhino-dev/rhino-react';
import {
  createElectronStorage,
  initElectronStorage,
} from '@rhino-dev/rhino-react/electron/renderer';

import { App } from './App';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

async function bootstrap() {
  // 1) Hydrate token/user/org from the encrypted main-process store (over IPC),
  //    so a previously signed-in user stays signed in across app restarts —
  //    without the token ever living in renderer localStorage.
  await initElectronStorage();

  // 2) Point rhino-react at the single-tenant server and tell it to read/write
  //    auth state through the safeStorage-backed adapter.
  //    - baseURL '/api' → dev proxy → 127.0.0.1:8000 (no CORS in dev).
  //    - tenancy 'subdomain' → single-tenant: data hooks build /api/{model} with
  //      no org segment.
  configureApi({
    baseURL: '/api',
    tenancy: 'subdomain',
    storage: createElectronStorage(),
    onUnauthorized: () => window.dispatchEvent(new CustomEvent('rhino:unauthorized')),
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
