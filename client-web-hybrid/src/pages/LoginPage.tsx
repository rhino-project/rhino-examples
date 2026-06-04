import { useState, type FormEvent } from 'react';
import { useAuth, setOrganization } from '@rhino-dev/rhino-react';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { detectGroup, SEEDED_CREDENTIALS } from '../lib/group';

// Group-aware sign-in. The group + org are derived from the browser host (the
// subdomain), shown in a banner, and the matching seeded credentials are
// pre-filled. login() posts to /api/auth/login; the forwarded Host makes the
// backend resolve the correct per-group auth route. A wrong-group / non-member
// login returns 403 (enforce_group_membership = ON) which we surface as an
// explicit "you're not a member of the {group} group" message — the headline demo.
export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const detected = detectGroup();
  const seeded = SEEDED_CREDENTIALS[detected.group];

  const [email, setEmail] = useState(seeded.email);
  const [password, setPassword] = useState(seeded.password);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDenied(null);
    const result = await login(email, password);
    setBusy(false);

    if (!result.success) {
      // The lib's login() maps any failure (including the membership 403) to
      // { success:false, error }. Make the cross-group denial explicit.
      const msg = `You're not a member of the ${detected.group} group` +
        (detected.org ? ` for "${detected.org}".` : '.') +
        ' (membership enforcement is ON for this backend.)';
      setDenied(msg);
      toast(msg, 'error');
      return;
    }

    toast(`Welcome, ${result.user?.name ?? email}`, 'ok');
    if (result.user?.name) localStorage.setItem('rhino_user_name', result.user.name);
    if (result.user?.email) localStorage.setItem('rhino_user_email', result.user.email);
    // With tenancy:'subdomain' the org is carried by the request HOST, so it is
    // NEVER placed in the URL path. But the stock data hooks stay disabled until
    // an org slug is present in context (enabled: !!organization), so we set one
    // to unlock the query: the subdomain org for agency/vendor, or the group name
    // as an org-less sentinel for personal. It gates the hook; it is not routed.
    setOrganization(detected.org ?? detected.group);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">TaskFlow <span>/hybrid</span></div>
        </div>

        <div className={`group-banner group-${detected.group}`}>
          <div className="group-banner-line">
            Signing in to the <b>{detected.label}</b> workspace
            {detected.org ? <> — org: <b>{detected.org}</b></> : <> — <b>no org</b> (user-owned)</>}
          </div>
          <div className="group-banner-host">{window.location.host}</div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">
          Domain route groups + group-aware auth — powered by Rhino.
        </p>

        {denied && (
          <div className="alert alert-error" role="alert">
            <b>403 — Access denied.</b> {denied}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? <><span className="spinner" /> Signing in…</> : <><Icon.lock size={14} /> Sign in</>}
          </button>
        </form>

        <div className="login-hint">
          <b># This group's seeded account</b>
          <div style={{ marginTop: 4, cursor: 'pointer' }}
               onClick={() => { setEmail(seeded.email); setPassword(seeded.password); }}>
            {seeded.email} · {seeded.password} <span className="faint">→ {detected.group}</span>
          </div>
          <div className="faint" style={{ marginTop: 8 }}>
            Try the cross-group 403: open this on a different group's subdomain and
            sign in with this account — membership enforcement denies it.
          </div>
        </div>
      </div>
    </div>
  );
}
