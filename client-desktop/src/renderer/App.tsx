import { useEffect } from 'react';
import { useAuth, useModelIndex } from '@rhino-dev/rhino-react';

import { LoginPage } from './LoginPage';

interface Project {
  id: number;
  title: string;
  status?: string;
  description?: string;
}

export function App() {
  const { isAuthenticated, logout } = useAuth();

  // A 401 clears the token (axios interceptor) and fires this event; drop to login.
  useEffect(() => {
    const onUnauth = () => void logout();
    window.addEventListener('rhino:unauthorized', onUnauth);
    return () => window.removeEventListener('rhino:unauthorized', onUnauth);
  }, [logout]);

  if (!isAuthenticated) return <LoginPage />;
  // Display name is non-sensitive; the LoginPage stashes it for the header.
  // (The TOKEN is what lives in the encrypted main-process store.)
  const userName =
    localStorage.getItem('rhino_user_name') ||
    localStorage.getItem('rhino_user_email') ||
    'Signed in';
  return <Shell userName={userName} onLogout={logout} />;
}

function Shell({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const projects = useModelIndex<Project>('projects', { sort: 'title', perPage: 50 });
  const list = projects.data?.data ?? [];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-name">
            TaskFlow <em>/desktop</em>
          </span>
        </div>
        <div className="topbar-right">
          <span className="secure-pill" title="Token is encrypted at rest via Electron safeStorage (OS keychain)">
            🔒 token in OS keychain
          </span>
          <span className="who">{userName}</span>
          <button className="btn" onClick={() => void onLogout()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <div className="content-head">
          <h1>Projects</h1>
          <span className="muted">
            {projects.isFetching ? 'syncing…' : `${list.length} item${list.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {projects.isLoading ? (
          <div className="card muted">Loading projects…</div>
        ) : projects.isError ? (
          <div className="card error">Could not load projects. Is the Laravel server running on :8000?</div>
        ) : list.length === 0 ? (
          <div className="card muted">No projects yet.</div>
        ) : (
          <ul className="list">
            {list.map((p) => (
              <li key={p.id} className="row">
                <div className="row-main">
                  <span className="row-title">{p.title}</span>
                  {p.description ? <span className="row-sub">{p.description}</span> : null}
                </div>
                {p.status ? <span className={`tag tag-${p.status}`}>{p.status}</span> : null}
              </li>
            ))}
          </ul>
        )}

        <p className="footnote">
          Data is fetched with <code>useModelIndex('projects')</code> from{' '}
          <code>@rhino-dev/rhino-react</code>. The auth token lives in the Electron main
          process (encrypted via <code>safeStorage</code>), reached over IPC — never in
          renderer <code>localStorage</code>.
        </p>
      </main>
    </div>
  );
}
