import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, initStorage, useAuth } from '@rhino-dev/rhino-react';
import { StatusBar } from 'expo-status-bar';

import { ToastProvider } from '../components/Toaster';
import { colors } from '../theme';
import { ensureApiConfigured } from '../lib/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

// AsyncStorage is async — wait for it to hydrate before mounting the tree so
// the AuthProvider can read the persisted token immediately.
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

// Tiny gate that redirects between (auth) and (tabs) based on auth state.
function AuthGate() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) router.replace('/(auth)/login');
    else if (isAuthenticated && inAuthGroup) router.replace('/(tabs)');
  }, [isAuthenticated, segments]);
  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
        <QueryClientProvider client={queryClient}>
          <Bootstrapper>
            <AuthProvider>
              <ToastProvider>
                <AuthGate />
              </ToastProvider>
            </AuthProvider>
          </Bootstrapper>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}
