import { useState } from 'react';
import { GROUPS, resolveHost, type GroupFace } from '../groups/registry';
import { useGroup } from '../groups/GroupContext';
import { Icon } from '../components/Icons';

// ── Entry screen ──────────────────────────────────────────────────────────
//
// Lists the registry's GROUPS as cards (label + accent). Tenant faces (agency /
// vendor) show an org-slug input defaulting to face.demo.org. Picking a card
// calls selectGroup(face, org) — which wires the X-Rhino-Host header — and the
// app then advances to that face's generic Login.
export function GroupSelect() {
  const { selectGroup } = useGroup();
  // Per-tenant-face org slug input state (defaults to the seeded demo org).
  const [orgs, setOrgs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      GROUPS.filter((g) => g.tenant).map((g) => [g.key, g.demo.org ?? '']),
    ),
  );

  function pick(face: GroupFace) {
    selectGroup(face, face.tenant ? orgs[face.key] : undefined);
  }

  return (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">
            TaskFlow <span>/hybrid</span>
          </div>
        </div>

        <h1 className="login-title">Choose a workspace</h1>
        <p className="login-sub">
          One app, many faces. Pick a route group to sign into — each has its own
          host, sign-in, membership, and data.
        </p>

        <div className="group-cards">
          {GROUPS.map((face) => {
            const org = face.tenant ? orgs[face.key] : undefined;
            const host = resolveHost(face, org);
            return (
              <div
                key={face.key}
                className={`group-card group-${face.key}`}
                style={{ borderLeftColor: face.accent }}
              >
                <div className="group-card-main">
                  <div className="group-card-head">
                    <span
                      className="group-dot"
                      style={{ background: face.accent }}
                    />
                    <span className="group-card-label">{face.label}</span>
                    <span className="group-card-tag">
                      {face.tenant ? 'org-scoped' : 'user-owned'}
                    </span>
                  </div>
                  <div className="group-card-host mono">{host}</div>

                  {face.tenant && (
                    <div
                      className="field"
                      style={{ marginTop: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label>Organization slug</label>
                      <input
                        className="input"
                        value={orgs[face.key]}
                        onChange={(e) =>
                          setOrgs((s) => ({ ...s, [face.key]: e.target.value }))
                        }
                        placeholder={face.demo.org}
                      />
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary group-card-go"
                  onClick={() => pick(face)}
                  disabled={face.tenant && !orgs[face.key]}
                  style={{ background: face.accent, color: '#001714' }}
                >
                  Continue <Icon.arrowR size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="login-hint" style={{ marginTop: 18 }}>
          <b># How targeting works</b>
          <div style={{ marginTop: 4 }}>
            The picked host is sent as <span className="accent">X-Rhino-Host</span>;
            the Vite proxy rewrites the upstream Host so Laravel routes to the
            right group on plain localhost.
          </div>
        </div>
      </div>
    </div>
  );
}
