import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, initStorage, useAuth } from '@rhino-dev/rhino-react';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '../components/Toaster';
import { colors } from '../theme';
import { ensureApiConfigured } from '../src/lib/api';
import { GroupProvider, useActiveGroup } from '../src/groups/GroupContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

// AsyncStorage is async — wait for it to hydrate before mounting the tree so the
// AuthProvider and GroupProvider can read persisted state synchronously.
function Bootstrapper({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    ensureApiConfigured();
    initStorage().finally(() => setReady(true));
  }, []);
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg0 }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <>{children}</>;
}

// Routing gate: pick a group first, then sign in, then the workspace.
//   - no active face         -> '/'        (GroupSelect)
//   - face but not signed in -> '/login'
//   - face + signed in       -> '/workspace'
function Gate() {
  const active = useActiveGroup();
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const top = segments[0] as string | undefined;
    const onSelect = top === undefined || top === 'index';
    if (!active) {
      if (!onSelect) router.replace('/');
    } else if (!isAuthenticated) {
      if (top !== 'login') router.replace('/login');
    } else {
      if (top !== 'workspace') router.replace('/workspace');
    }
  }, [active, isAuthenticated, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
        <QueryClientProvider client={queryClient}>
          <Bootstrapper>
            {/* Subdomain tenancy: the org is carried by the Host header (set per
                face by GroupContext), so data hooks build /api/{model}. */}
            <AuthProvider tenancy="subdomain">
              <GroupProvider>
                <ToastProvider>
                  <Gate />
                </ToastProvider>
              </GroupProvider>
            </AuthProvider>
          </Bootstrapper>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}
