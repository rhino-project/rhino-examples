import { useState, type FormEvent } from 'react';
import { useAuth, setOrganization } from '@rhino-dev/rhino-react';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { useActiveGroup, useGroup } from '../groups/GroupContext';

// Generic, face-agnostic sign-in. The active face comes from GroupContext (set
// by the GroupSelect entry screen). Its X-Rhino-Host header is already wired, so
// login() posts to /api/auth/login and the forwarded Host makes Laravel resolve
// the correct per-group auth route. A wrong-group / non-member login returns 403
// (enforce_group_membership = ON), surfaced as "not a member of the {label}".
export function LoginPage() {
  const { login } = useAuth();
  const { clearGroup } = useGroup();
  const toast = useToast();
  const { face, org, host } = useActiveGroup();

  const [email, setEmail] = useState(face.demo.email);
  const [password, setPassword] = useState(face.demo.password);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDenied(null);
    const result = await login(email, password);
    setBusy(false);

    if (!result.success) {
      // login() now reports the HTTP status. A 403 is the membership denial
      // (enforce_group_membership = ON); anything else is a generic auth failure.
      const msg =
        result.status === 403
          ? `You're not a member of the ${face.label}` +
            (org ? ` for "${org}".` : '.') +
            ' (membership enforcement is ON for this backend.)'
          : result.error ?? 'Sign-in failed. Check your credentials and try again.';
      setDenied(msg);
      toast(msg, 'error');
      return;
    }

    toast(`Welcome, ${result.user?.name ?? email}`, 'ok');
    if (result.user?.name) localStorage.setItem('rhino_user_name', result.user.name);
    if (result.user?.email) localStorage.setItem('rhino_user_email', result.user.email);
    // tenancy:'subdomain' → the org is carried by the Host, never the URL path.
    // The stock data hooks now run with NO org in subdomain mode, so set the org
    // only for tenant faces; the personal (org-less) face needs no placeholder.
    if (org) setOrganization(org);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">
            TaskFlow <span>/hybrid</span>
          </div>
        </div>

        <div
          className={`group-banner group-${face.key}`}
          style={{ borderLeftColor: face.accent }}
        >
          <div className="group-banner-line">
            Signing in to the <b>{face.label}</b>
            {org ? (
              <>
                {' '}— org: <b>{org}</b>
              </>
            ) : (
              <>
                {' '}— <b>no org</b> (user-owned)
              </>
            )}
          </div>
          <div className="group-banner-host">{host}</div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">
          Domain route groups + group-aware auth — powered by Rhino.
        </p>

        {denied && (
          <div className="alert alert-error" role="alert">
            <b>Access denied.</b> {denied}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy}
            style={{ justifyContent: 'center' }}
          >
            {busy ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              <>
                <Icon.lock size={14} /> Sign in
              </>
            )}
          </button>
        </form>

        <div className="login-hint">
          <b># This face's seeded account</b>
          <div
            style={{ marginTop: 4, cursor: 'pointer' }}
            onClick={() => {
              setEmail(face.demo.email);
              setPassword(face.demo.password);
            }}
          >
            {face.demo.email} · {face.demo.password}{' '}
            <span className="faint">→ {face.key}</span>
          </div>
          <div className="faint" style={{ marginTop: 8 }}>
            Try the cross-group 403: switch to a different group and sign in with
            this account — membership enforcement denies it.
          </div>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
          onClick={clearGroup}
        >
          <Icon.arrowL size={14} /> Switch group
        </button>
      </div>
    </div>
  );
}
