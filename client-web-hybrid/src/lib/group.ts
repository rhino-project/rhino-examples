// Group / organization detection from the browser host.
//
// The hybrid backend's route groups are DOMAIN-scoped:
//   {organization}.agency.lvh.me  -> group "agency", org = leftmost label
//   {organization}.vendor.lvh.me  -> group "vendor", org = leftmost label
//   app.lvh.me (apex)             -> group "personal", org = null
//
// We never put the org in the request path or call setOrganization; the Host
// header (forwarded by the vite proxy with changeOrigin:false) carries BOTH the
// group and the org for agency/vendor.

export type GroupName = 'personal' | 'agency' | 'vendor';

export interface DetectedGroup {
  group: GroupName;
  org: string | null;
  /** The model slug this group lists, used by the post-login workspace view. */
  modelSlug: 'personal-projects' | 'projects';
  /** Human label for the banner. */
  label: string;
}

export function detectGroup(hostname: string = window.location.hostname): DetectedGroup {
  const host = hostname.toLowerCase();
  const labels = host.split('.');

  // *.agency.lvh.me  -> agency, org = leftmost label
  if (host.includes('.agency.')) {
    return { group: 'agency', org: labels[0], modelSlug: 'projects', label: 'AGENCY' };
  }
  // *.vendor.lvh.me  -> vendor, org = leftmost label
  if (host.includes('.vendor.')) {
    return { group: 'vendor', org: labels[0], modelSlug: 'projects', label: 'VENDOR' };
  }
  // Anything else (app.lvh.me, localhost, …) -> personal, user-owned, no org.
  return { group: 'personal', org: null, modelSlug: 'personal-projects', label: 'PERSONAL' };
}

// Seeded credentials per group (from server-laravel-hybrid DatabaseSeeder).
export const SEEDED_CREDENTIALS: Record<GroupName, { email: string; password: string }> = {
  personal: { email: 'personal@example.com', password: 'password' },
  agency: { email: 'agency@acme.com', password: 'password' },
  vendor: { email: 'vendor@globex.com', password: 'password' },
};
