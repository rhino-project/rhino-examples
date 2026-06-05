// ── Group registry — the ONLY place per-group specifics live ──────────────
//
// One app, many "faces." Each entry below is a self-contained description of a
// backend route group (server-laravel-hybrid config/rhino.php + DatabaseSeeder):
//
//   personal -> apex host app.lvh.me, org-less, model `personal-projects`
//   agency   -> {org}.agency.lvh.me, org-scoped, model `projects`
//   vendor   -> {org}.vendor.lvh.me, org-scoped, model `projects`
//
// Adding / removing a face is a one-file change here; the rest of the app is
// generic and reads the active face from GroupContext.

export type GroupKey = 'personal' | 'agency' | 'vendor';

export interface GroupFace {
  key: GroupKey;
  /** Human label for banners / the group picker. */
  label: string;
  /** Org-scoped? agency/vendor true; personal false. */
  tenant: boolean;
  /** Host template. `{org}` is substituted for tenant faces. */
  hostPattern: string;
  /** List model the workspace shows for this face. */
  model: 'personal-projects' | 'projects';
  /** Per-face brand accent (visual distinction). */
  accent: string;
  /** Seeded demo credentials (from server-laravel-hybrid DatabaseSeeder). */
  demo: { email: string; password: string; org?: string };
}

export const GROUPS: GroupFace[] = [
  {
    key: 'personal',
    label: 'Personal',
    tenant: false,
    hostPattern: 'app.lvh.me',
    model: 'personal-projects',
    accent: '#00d9c0',
    demo: { email: 'personal@example.com', password: 'password' },
  },
  {
    key: 'agency',
    label: 'Agency Workspace',
    tenant: true,
    hostPattern: '{org}.agency.lvh.me',
    model: 'projects',
    accent: '#8b9cff',
    demo: { email: 'agency@acme.com', password: 'password', org: 'acme' },
  },
  {
    key: 'vendor',
    label: 'Vendor Portal',
    tenant: true,
    hostPattern: '{org}.vendor.lvh.me',
    model: 'projects',
    accent: '#ffb454',
    demo: { email: 'vendor@globex.com', password: 'password', org: 'globex' },
  },
];

/** Resolve the request HOST for a face (the value sent as `X-Rhino-Host`). */
export const resolveHost = (f: GroupFace, org?: string): string =>
  f.tenant ? f.hostPattern.replace('{org}', org ?? f.demo.org!) : f.hostPattern;

export const getFace = (key: GroupKey): GroupFace =>
  GROUPS.find((g) => g.key === key)!;

/**
 * Subdomain auto-detect: if the browser is already on a recognized `*.lvh.me`
 * host, return the matching face + org so the picker can preselect it. The Host
 * is already correct in that case; the `X-Rhino-Host` header just mirrors it.
 */
export function detectFaceFromHost(
  hostname: string = window.location.hostname,
): { face: GroupFace; org?: string } | null {
  const host = hostname.toLowerCase();
  const labels = host.split('.');
  if (host.includes('.agency.')) {
    return { face: getFace('agency'), org: labels[0] };
  }
  if (host.includes('.vendor.')) {
    return { face: getFace('vendor'), org: labels[0] };
  }
  // Apex personal host only — plain localhost/127.0.0.1 is NOT auto-detected,
  // so the picker is shown (the demo's entry point on localhost:5173).
  if (host === 'app.lvh.me') {
    return { face: getFace('personal') };
  }
  return null;
}
