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
 * Apply a face to the API layer: set the resolved Host header and the org slug
 * the data hooks gate on (`useModelIndex` is `enabled: !!organization`, even in
 * subdomain mode where the org is NOT placed in the URL). The personal face is
 * org-less on the backend, so we use its key as a non-empty placeholder slug
 * purely to enable the hooks; it never reaches the wire.
 */
function applyFaceToApi(face: GroupFace, org?: string): { host: string; org: string } {
  const host = resolveHost(face, org);
  const orgSlug = face.tenant ? (org ?? face.demo.org!) : face.key;
  setApiHost(host);
  setOrganization(orgSlug);
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
