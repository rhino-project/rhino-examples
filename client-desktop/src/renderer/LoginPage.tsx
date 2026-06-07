import { useState, type FormEvent } from 'react';
import { useAuth } from '@rhino-dev/rhino-react';

const DEMO_USERS = [
  { email: 'alice@example.com', password: 'password' },
  { email: 'bob@example.com', password: 'password' },
];

export function LoginPage() {
  const { login } = useAuth();
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
      setError(result.error ?? 'Sign-in failed. Check your credentials and try again.');
      return;
    }
    // On success the token is written through the secure (safeStorage) adapter,
    // and useAuth flips isAuthenticated → App renders the shell. Stash the
    // (non-sensitive) display name for the header.
    if (result.user?.name) localStorage.setItem('rhino_user_name', result.user.name);
    localStorage.setItem('rhino_user_email', result.user?.email ?? email);
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-name">
            TaskFlow <em>/desktop</em>
          </span>
        </div>
        <h1 className="login-title">Sign in</h1>
        <p className="login-sub">Single-tenant Rhino backend · token stored in the OS keychain.</p>

        {error ? (
          <div className="alert">
            <b>Sign-in failed.</b> {error}
          </div>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">
          <b>Seeded accounts (password: password)</b>
          {DEMO_USERS.map((u) => (
            <button
              type="button"
              key={u.email}
              className="hint-row"
              onClick={() => {
                setEmail(u.email);
                setPassword(u.password);
              }}
            >
              {u.email}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
