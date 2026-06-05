// Active-face state for the multi-face app.
//
// Holds the selected GroupFace + the resolved request host (+ org for tenant
// faces), persisted across launches via rhino-react's `storage` adapter
// (AsyncStorage on native). `useActiveGroup()` reads it; `selectGroup(face, org)`
// sets it AND wires the API target (Host header + the org slug the data hooks
// gate on) and resets auth so credentials never leak between faces.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { storage, setOrganization } from '@rhino-dev/rhino-react';
import { GROUPS, getGroup, resolveHost, type GroupFace } from './registry';
import { setApiHost } from '../lib/api';

const STORE_KEY = 'active_face';

interface PersistedFace {
  key: GroupFace['key'];
  org?: string;
}

interface ActiveGroup {
  face: GroupFace;
  host: string;
  org?: string;
}

interface GroupContextValue {
  active: ActiveGroup | null;
  /** Select a face (optionally with an org slug for tenant faces) and wire the API. */
  selectGroup: (face: GroupFace, org?: string) => void;
  /** Clear the active face (return to the group picker). */
  clearGroup: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

/**
 * Apply a face to the API layer: set the resolved Host header and (for tenant
 * faces) the org slug. In subdomain mode the data hooks run with NO org in
 * context, so the personal (org-less) face needs no placeholder slug — we set
 * the org only for tenant faces, where it travels via the Host, not the URL.
 */
function applyFaceToApi(face: GroupFace, org?: string): { host: string; org?: string } {
  const host = resolveHost(face, org);
  const orgSlug = face.tenant ? (org ?? face.demo.org!) : undefined;
  setApiHost(host);
  setOrganization(orgSlug ?? null);
  return { host, org: orgSlug };
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveGroup | null>(null);

  // Rehydrate the persisted face on mount and re-wire the API target.
  useEffect(() => {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PersistedFace;
      const face = getGroup(parsed.key);
      const { host, org } = applyFaceToApi(face, parsed.org);
      setActive({ face, host, org });
    } catch {
      storage.removeItem(STORE_KEY);
    }
  }, []);

  const selectGroup = useCallback((face: GroupFace, org?: string) => {
    const { host, org: orgSlug } = applyFaceToApi(face, org);
    storage.setItem(STORE_KEY, JSON.stringify({ key: face.key, org: face.tenant ? orgSlug : undefined }));
    // Reset any prior session so a face switch never reuses another face's token.
    storage.removeItem('token');
    setActive({ face, host, org: orgSlug });
  }, []);

  const clearGroup = useCallback(() => {
    storage.removeItem(STORE_KEY);
    storage.removeItem('token');
    setApiHost(null);
    setOrganization(null);
    setActive(null);
  }, []);

  return (
    <GroupContext.Provider value={{ active, selectGroup, clearGroup }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider');
  return ctx;
}

/** Convenience getter for the active face (or null if none selected yet). */
export function useActiveGroup(): ActiveGroup | null {
  return useGroup().active;
}

export { GROUPS };
