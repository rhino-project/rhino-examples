import { useEffect, useState } from 'react';
import { useAuth, useModelIndex, setOrganization } from '@rhino-dev/rhino-react';
import { Icon } from '../components/Icons';
import { detectGroup } from '../lib/group';
import { getForbidden, subscribeForbidden } from '../lib/forbidden';
import { fmtRelative } from '../lib/format';

type Row = {
  id: number | string;
  title?: string;
  name?: string;
  status?: string;
  description?: string;
  updated_at?: string;
};

// The focused post-login view: a group/org banner + the group's data list.
//   personal -> personal-projects (user-owned, org-less)
//   agency/vendor -> projects (org-scoped via the subdomain Host)
export function WorkspacePage() {
  const { logout } = useAuth();
  const detected = detectGroup();
  // Stock rhino-react hook. With tenancy:'subdomain' (set in main.tsx) it builds
  // /api/{model} — no org path segment — and the subdomain Host carries the org.
  const query = useModelIndex<Row>(detected.modelSlug);
  const rows = query.data?.data ?? [];

  // Surface any 403 raised by a data request (membership denied) via onForbidden.
  const [forbidden, setForbiddenState] = useState<string | null>(getForbidden);
  useEffect(() => subscribeForbidden(setForbiddenState), []);

  const name = (typeof localStorage !== 'undefined' && localStorage.getItem('rhino_user_name')) || 'User';

  return (
    <div className="workspace">
      <header className="ws-header">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">TaskFlow <span>/hybrid</span></div>
        </div>
        <div className="header-actions">
          <span className="user-chip">{name}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setOrganization(null); logout(); }} title="Sign out">
            <Icon.logout size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="ws-main">
        <div className={`group-banner group-${detected.group}`}>
          <div className="group-banner-line">
            <b>{detected.label}</b> workspace
            {detected.org ? <> — org: <b>{detected.org}</b></> : <> — <b>no org</b> (user-owned)</>}
            {' '}· model: <span className="mono">{detected.modelSlug}</span>
          </div>
          <div className="group-banner-host">{window.location.host}</div>
        </div>

        {forbidden && (
          <div className="alert alert-error" role="alert">
            <b>403 — Membership denied.</b> {forbidden}
          </div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">{detected.modelSlug}</div>
            {query.isFetching && <span className="faint">Loading…</span>}
          </div>

          {query.isError ? (
            <div className="card-empty">Could not load {detected.modelSlug}.</div>
          ) : rows.length === 0 && !query.isLoading ? (
            <div className="card-empty">No {detected.modelSlug} yet.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Title</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.title ?? r.name ?? `#${r.id}`}</div>
                      {r.description && <div className="faint" style={{ fontSize: 12 }}>{r.description.slice(0, 90)}</div>}
                    </td>
                    <td>{r.status ?? '—'}</td>
                    <td className="faint">{fmtRelative(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="faint" style={{ marginTop: 14, fontSize: 12 }}>
          Data was fetched by the stock <span className="mono">useModelIndex</span> hook with{' '}
          <span className="mono">tenancy:'subdomain'</span> — it built{' '}
          <span className="mono">/api/{detected.modelSlug}</span> with no org path prefix; the subdomain
          Host carries the group{detected.org ? ' and org' : ''}.
        </p>
      </main>
    </div>
  );
}
