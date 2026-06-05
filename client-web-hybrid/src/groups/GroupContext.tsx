import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setOrganization } from '@rhino-dev/rhino-react';

import {
  GROUPS,
  detectFaceFromHost,
  getFace,
  resolveHost,
  type GroupFace,
  type GroupKey,
} from './registry';

// ── Active-face state + API targeting wiring ──────────────────────────────
//
// Holds the selected GroupFace + the resolved request HOST (+ org for tenant
// faces), persisted to localStorage. selectGroup() ALSO wires the API target:
// it sets the `X-Rhino-Host` default header on rhino-react's exported axios
// instance (`api`) so EVERY request carries the chosen host. The vite proxy
// (changeOrigin:false) reads that header and rewrites the upstream `Host`, which
// drives Laravel's Route::domain(...) group routing — so the picker works on
// plain localhost:5173. No rhino-react change is needed: `api` is exported from
// the lib barrel and `api.defaults.headers.common` is the documented axios hook.

const HEADER = 'X-Rhino-Host';
const STORAGE_KEY = 'rhino_active_group';

export interface ActiveGroup {
  face: GroupFace;
  org?: string;
  /** The resolved request host, mirrored into the X-Rhino-Host header. */
  host: string;
}

interface GroupContextValue {
  active: ActiveGroup | null;
  /** Select a face (and org for tenant faces); wires the header + resets auth. */
  selectGroup: (face: GroupFace, org?: string) => void;
  /** Return to the group picker; clears the header + org. */
  clearGroup: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

/** Push the resolved host into the axios default header (or clear it). */
function applyHostHeader(host: string | null) {
  if (host) {
    api.defaults.headers.common[HEADER] = host;
  } else {
    delete api.defaults.headers.common[HEADER];
  }
}

function loadPersisted(): ActiveGroup | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { key, org } = JSON.parse(raw) as { key: GroupKey; org?: string };
    const face = GROUPS.find((g) => g.key === key);
    if (!face) return null;
    return { face, org, host: resolveHost(face, org) };
  } catch {
    return null;
  }
}

/** Initial active group: subdomain auto-detect wins; else last persisted. */
function initialActive(): ActiveGroup | null {
  const detected = detectFaceFromHost();
  if (detected) {
    const { face, org } = detected;
    return { face, org, host: resolveHost(face, org) };
  }
  return loadPersisted();
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveGroup | null>(() => {
    const initial = initialActive();
    // Mirror the resolved host into the header at startup so the very first
    // request (e.g. an auto-detected subdomain reload) is already targeted.
    applyHostHeader(initial?.host ?? null);
    return initial;
  });

  const selectGroup = useCallback((face: GroupFace, org?: string) => {
    const resolvedOrg = face.tenant ? org ?? face.demo.org : undefined;
    const host = resolveHost(face, resolvedOrg);
    applyHostHeader(host);
    // Reset any org carried over from a previous face; the workspace re-sets it
    // after a successful login. Switching faces is a fresh auth context.
    setOrganization(null);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ key: face.key, org: resolvedOrg }),
    );
    setActive({ face, org: resolvedOrg, host });
  }, []);

  const clearGroup = useCallback(() => {
    applyHostHeader(null);
    setOrganization(null);
    localStorage.removeItem(STORAGE_KEY);
    setActive(null);
  }, []);

  const value = useMemo<GroupContextValue>(
    () => ({ active, selectGroup, clearGroup }),
    [active, selectGroup, clearGroup],
  );

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider');
  return ctx;
}

/** Convenience getter for the active face; throws if none is selected. */
export function useActiveGroup(): ActiveGroup {
  const { active } = useGroup();
  if (!active) throw new Error('No active group selected');
  return active;
}

export { getFace };
