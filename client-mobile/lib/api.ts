// Configure the Rhino axios instance with a base URL that actually works
// across simulators, emulators, AND physical devices loaded via Expo Go.
//
// Priority:
//  1. EXPO_PUBLIC_API_URL  — explicit override (set in .env or shell)
//  2. Metro host URI       — when running via Expo Go on a phone, the
//                            manifest hostUri carries the dev machine's
//                            LAN IP (e.g. 192.168.1.42:8081). We strip
//                            the port and point at :8000 there.
//  3. Android emulator     — 10.0.2.2 maps to the host
//  4. localhost            — iOS sim / web fallback
//
// IMPORTANT: `php artisan serve` only binds to 127.0.0.1 by default, so a
// phone on your LAN can't reach it. Start it with:
//     php artisan serve --host=0.0.0.0 --port=8000
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { configureApi } from '@rhino-dev/rhino-react';

function metroHost(): string | null {
  // Different Expo SDKs surface the host in slightly different places.
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.hostUri,
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool,
    (Constants as any).manifest?.debuggerHost,
    (Constants as any).manifest?.hostUri,
  ].filter(Boolean) as string[];
  const raw = candidates[0];
  if (!raw) return null;
  // raw looks like "192.168.1.42:8081" or "192.168.1.42" — keep just the host
  const host = raw.replace(/^https?:\/\//, '').split(':')[0];
  // Don't return loopback addresses; they won't help a device.
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function defaultBaseURL(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = metroHost();
  if (host) return `http://${host}:8000/api`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
  return 'http://localhost:8000/api'; // iOS sim, web
}

let configured = false;
export function ensureApiConfigured() {
  if (configured) return;
  const url = defaultBaseURL();
  configureApi({ baseURL: url });
  if (__DEV__) console.log('[Rhino API]', url);
  configured = true;
}
