import { useState, type FormEvent } from 'react';
import { useAuth } from '@rhino-dev/rhino-react';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';

const seededUsers = [
  { email: 'alice@example.com', password: 'password', role: 'user' },
  { email: 'bob@example.com',   password: 'password', role: 'user' },
];

export function LoginPage() {
  const { login, setOrganization } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.success) {
      toast(result.error ?? 'Login failed', 'error');
      return;
    }
    toast(`Welcome, ${result.user?.name ?? email}`, 'ok');
    // Stash the user info for the header chip and RBAC checks.
    if (result.user?.name)  localStorage.setItem('rhino_user_name',  result.user.name);
    if (result.user?.email) localStorage.setItem('rhino_user_email', result.user.email);
    if (result.organization_slug) {
      localStorage.setItem('rhino_organization_slug', result.organization_slug);
      // The data hooks (useModelIndex etc.) read the org slug from the auth
      // context, not localStorage — push it in or every request 400's with
      // "Organization slug is required".
      setOrganization(result.organization_slug);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">TaskFlow <span>/web</span></div>
        </div>
        <h1 className="login-title">Sign in to your workspace</h1>
        <p className="login-sub">Multi-tenant project management — powered by Rhino.</p>

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
          <b># Seeded accounts</b>
          {seededUsers.map(u => (
            <div key={u.email} style={{ marginTop: 4, cursor: 'pointer' }} onClick={() => { setEmail(u.email); setPassword(u.password); }}>
              {u.email} · {u.password} <span className="faint">→ {u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
