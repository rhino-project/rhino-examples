import { useState, type FormEvent } from 'react';
import { useAuth } from '@rhino-dev/rhino-react';
import { useToast } from '../components/Toaster';

// Single-tenant sign-in. login() posts to /api/auth/login; the backend returns
// { token, organization_slug: null } (no orgs here). We surface the error from
// login()'s result directly rather than relying on any redirect.
const DEMO_USERS = [
  { email: 'alice@example.com', password: 'password' },
  { email: 'bob@example.com', password: 'password' },
];

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState(DEMO_USERS[0].password);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);

    if (!result.success) {
      const msg = result.error ?? 'Sign-in failed. Check your credentials and try again.';
      setError(msg);
      toast(msg, 'error');
      return;
    }

    if (result.user?.name) localStorage.setItem('rhino_user_name', result.user.name);
    localStorage.setItem('rhino_user_email', result.user?.email ?? email);
    toast(`Welcome, ${result.user?.name ?? email}`, 'ok');
    // No setOrganization — single tenant. The stock data hooks build /api/{model}
    // with no org segment (tenancy:'subdomain').
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">
            TaskFlow <span>/single</span>
          </div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">
          Single-tenant, user-owned data — powered by Rhino.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <b>Sign-in failed.</b> {error}
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
              'Sign in'
            )}
          </button>
        </form>

        <div className="login-hint">
          <b># Seeded accounts (password: password)</b>
          {DEMO_USERS.map((u) => (
            <div
              key={u.email}
              style={{ marginTop: 4, cursor: 'pointer' }}
              onClick={() => {
                setEmail(u.email);
                setPassword(u.password);
              }}
            >
              {u.email} · {u.password}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
