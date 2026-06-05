// The ONE place per-group ("face") differences live. Adding or removing a face
// is a single-file change here; the rest of the app is generic and reads the
// active face from GroupContext.
//
// Creds + model slugs + hosts are taken from the server-laravel-hybrid backend:
//   - config/rhino.php           — route_groups (personal/agency/vendor) + domains
//   - database/seeders/DatabaseSeeder.php — seeded users, orgs, memberships
//
// Backend route_groups (config/rhino.php):
//   personal -> domain app.lvh.me          , models: ['personal-projects']  (org-less)
//   agency   -> domain {organization}.agency.lvh.me, models: projects/tasks/... (org acme)
//   vendor   -> domain {organization}.vendor.lvh.me, models: projects/tasks/... (org globex)

export interface GroupFace {
  key: 'personal' | 'agency' | 'vendor';
  label: string; // human label shown in the picker + banners
  tenant: boolean; // org-scoped? agency/vendor true, personal false
  hostPattern: string; // 'app.lvh.me' | '{org}.agency.lvh.me' | '{org}.vendor.lvh.me'
  model: string; // workspace list model: 'personal-projects' | 'projects'
  accent: string; // per-face brand colour (visual distinction)
  demo: { email: string; password: string; org?: string }; // seeded creds
}

export const GROUPS: GroupFace[] = [
  {
    key: 'personal',
    label: 'Personal',
    tenant: false,
    hostPattern: 'app.lvh.me',
    model: 'personal-projects',
    accent: '#00d9c0', // teal
    demo: { email: 'personal@example.com', password: 'password' },
  },
  {
    key: 'agency',
    label: 'Agency Workspace',
    tenant: true,
    hostPattern: '{org}.agency.lvh.me',
    model: 'projects',
    accent: '#a78bfa', // violet
    demo: { email: 'agency@acme.com', password: 'password', org: 'acme' },
  },
  {
    key: 'vendor',
    label: 'Vendor Portal',
    tenant: true,
    hostPattern: '{org}.vendor.lvh.me',
    model: 'projects',
    accent: '#fb923c', // orange
    demo: { email: 'vendor@globex.com', password: 'password', org: 'globex' },
  },
];

/**
 * Resolve the request HOST for a face. Tenant faces substitute the org slug
 * (defaulting to the seeded demo org); the apex personal face is static.
 *
 * agency + acme  -> 'acme.agency.lvh.me'
 * vendor + globex -> 'globex.vendor.lvh.me'
 * personal        -> 'app.lvh.me'
 */
export const resolveHost = (f: GroupFace, org?: string): string =>
  f.tenant ? f.hostPattern.replace('{org}', org ?? f.demo.org!) : f.hostPattern;

export const getGroup = (key: GroupFace['key']): GroupFace => {
  const g = GROUPS.find((f) => f.key === key);
  if (!g) throw new Error(`Unknown group: ${key}`);
  return g;
};
