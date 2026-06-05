// API targeting for the multi-face hybrid app (mobile).
//
// Two independent axes:
//
//  1. baseURL — WHERE the bytes go. Always the dev machine running Laravel on
//     :8002. We derive the dev host from Expo's `hostUri` (the LAN IP of the
//     machine running Metro) so a physical device over Expo Go can reach it.
//     `lvh.me` subdomains do NOT resolve on a phone, so we never point baseURL
//     at them.
//
//  2. Host header — WHICH backend route group answers. Laravel disambiguates
//     personal/agency/vendor by `Route::domain(...)`. RN (unlike a browser) is
//     allowed to set the `Host` request header, so we send the resolved face
//     host (e.g. `acme.agency.lvh.me`) and Laravel routes to that group. This is
//     THE mechanism that makes the group picker work without DNS for lvh.me.
//
// We do NOT edit the lib: we use rhino-react's exported `api` axios instance and
// set `api.defaults.headers.common.Host` + call its `configureApi`. `tenancy` is
// 'subdomain' (org carried by the Host, data hooks build `/api/{model}` with no
// org path segment). `routeGroup` is NOT used (the Host selects the group).
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { configureApi, api } from '@rhino-dev/rhino-react';

const BACKEND_PORT = 8002;

/** Pull the dev machine host (LAN IP) out of the Expo manifest, if present. */
export function metroHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.hostUri,
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool,
    (Constants as any).manifest?.debuggerHost,
    (Constants as any).manifest?.hostUri,
  ].filter(Boolean) as string[];
  const raw = candidates[0];
  if (!raw) return null;
  const host = raw.replace(/^https?:\/\//, '').split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

/** Compose the baseURL that points at Laravel on the dev machine (:8002). */
export function resolveBaseURL(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = metroHost();
  if (host) return `http://${host}:${BACKEND_PORT}/api`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${BACKEND_PORT}/api`;
  return `http://localhost:${BACKEND_PORT}/api`; // iOS sim / web
}

let configured = false;

// The lib's `login()` swallows the HTTP error and only returns a message string,
// so we can't read the status from the result. Instead we register an
// `onForbidden` handler that records the moment a 403 was seen; the Login screen
// reads `wasRecentlyForbidden()` to know a membership denial (not a bad password)
// just happened. 403 means: authenticated, but not a member of THIS group.
let lastForbiddenAt = 0;

/** True if a 403 (group-membership denial) was seen within the last `withinMs`. */
export function wasRecentlyForbidden(withinMs = 3000): boolean {
  return Date.now() - lastForbiddenAt < withinMs;
}

/**
 * Configure rhino-react's API client once. Sets the dev-machine baseURL and
 * subdomain tenancy. The per-group Host header is applied separately by
 * `setApiHost` whenever the active face changes.
 */
export function ensureApiConfigured(): void {
  if (configured) return;
  configureApi({
    baseURL: resolveBaseURL(),
    tenancy: 'subdomain',
    onForbidden: () => { lastForbiddenAt = Date.now(); },
  });
  if (__DEV__) console.log('[Rhino API] baseURL', resolveBaseURL(), '(tenancy: subdomain)');
  configured = true;
}

/**
 * Point the API client at a specific backend route group by setting the default
 * `Host` header on the shared rhino-react axios instance. Every subsequent
 * request (login, model index, ...) carries this Host so Laravel's
 * `Route::domain(...)` resolves the right group + organization.
 *
 * NB: this mutates `api.defaults` on the lib's exported instance — a supported,
 * non-lib-change integration point (see configureApi docs).
 */
export function setApiHost(host: string | null): void {
  if (host) {
    api.defaults.headers.common['Host'] = host;
  } else {
    delete api.defaults.headers.common['Host'];
  }
  if (__DEV__) console.log('[Rhino API] Host ->', host ?? '(cleared)');
}
